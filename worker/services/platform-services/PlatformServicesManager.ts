/**
 * Platform Services Manager
 * Handles provisioning of built-in backend services (D1, R2) for user apps
 */

/// <reference path="../../worker-configuration.d.ts" />

import { BaseService } from '../../database/services/BaseService';

export interface PlatformServices {
    database?: {
        type: 'd1';
        databaseId?: string;
        databaseName: string;
        bindingName: string;
    };
    storage?: {
        type: 'r2';
        bucketName: string;
        bindingName: string;
    };
    envVars: Record<string, string>;
}

export interface ServicePreferences {
    includeDatabase?: boolean;
    includeStorage?: boolean;
}

export class PlatformServicesManager extends BaseService {
    private readonly accountId: string;
    private readonly apiToken: string;
    private readonly baseUrl = 'https://api.cloudflare.com/client/v4';

    constructor(env: Env) {
        super(env);
        if (!env.CLOUDFLARE_API_TOKEN || !env.CLOUDFLARE_ACCOUNT_ID) {
            throw new Error('CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID are required for platform services');
        }
        this.accountId = env.CLOUDFLARE_ACCOUNT_ID as string;
        this.apiToken = env.CLOUDFLARE_API_TOKEN as string;
    }

    /**
     * Generate request headers with authorization
     */
    private getHeaders(contentType?: string): Record<string, string> {
        const headers: Record<string, string> = {
            Authorization: `Bearer ${this.apiToken}`,
        };
        if (contentType) {
            headers['Content-Type'] = contentType;
        }
        return headers;
    }

    /**
     * Provision platform services for an app
     */
    async provisionServicesForApp(
        appId: string,
        userId: string,
        preferences: ServicePreferences
    ): Promise<PlatformServices> {
        const services: PlatformServices = {
            envVars: {},
        };

        try {
            // Provision D1 Database if requested
            if (preferences.includeDatabase) {
                const dbService = await this.provisionD1Database(appId, userId);
                if (dbService) {
                    services.database = dbService;
                    // D1 connection is handled via binding, but we can provide the database name
                    services.envVars['DATABASE_NAME'] = dbService.databaseName;
                    services.envVars['DATABASE_BINDING'] = dbService.bindingName;
                }
            }

            // Provision R2 Storage if requested
            if (preferences.includeStorage) {
                const r2Service = await this.provisionR2Bucket(appId, userId);
                if (r2Service) {
                    services.storage = r2Service;
                    services.envVars['R2_BUCKET_NAME'] = r2Service.bucketName;
                    services.envVars['R2_BINDING'] = r2Service.bindingName;
                    services.envVars['R2_ACCOUNT_ID'] = this.env.CLOUDFLARE_ACCOUNT_ID as string;
                }
            }

            this.logger.info('Platform services provisioned', {
                appId,
                userId,
                services: {
                    database: !!services.database,
                    storage: !!services.storage,
                },
            });

            return services;
        } catch (error) {
            this.logger.error('Failed to provision platform services', error);
            throw error;
        }
    }

    /**
     * Provision a D1 database for an app
     */
    private async provisionD1Database(
        appId: string,
        _userId: string
    ): Promise<PlatformServices['database']> {
        const databaseName = `app-${appId}-db`;
        const bindingName = 'DB'; // Standard binding name

        try {
            // Create D1 database via Cloudflare API
            const url = `${this.baseUrl}/accounts/${this.accountId}/d1/database`;
            const response = await fetch(url, {
                method: 'POST',
                headers: this.getHeaders('application/json'),
                body: JSON.stringify({ name: databaseName }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ errors: [{ message: 'Unknown error' }] })) as { errors?: Array<{ message?: string }> };
                const errorMessage = errorData.errors?.[0]?.message || `HTTP ${response.status}`;
                
                // If database already exists, try to find it
                if (errorMessage.includes('already exists') || response.status === 409) {
                    const existing = await this.findD1Database(databaseName);
                    if (existing) {
                        this.logger.info('D1 database already exists, reusing', {
                            appId,
                            databaseId: existing.uuid,
                            databaseName,
                        });
                        return {
                            type: 'd1',
                            databaseId: existing.uuid,
                            databaseName,
                            bindingName,
                        };
                    }
                }
                throw new Error(`Failed to create D1 database: ${errorMessage}`);
            }

            const data = await response.json() as { result?: { uuid?: string } };
            const databaseId = data.result?.uuid;

            if (!databaseId) {
                throw new Error('D1 database created but no UUID returned');
            }

            this.logger.info('D1 database created', {
                appId,
                databaseId,
                databaseName,
            });

            return {
                type: 'd1',
                databaseId,
                databaseName,
                bindingName,
            };
        } catch (error) {
            this.logger.error('Failed to create D1 database', error);
            throw error;
        }
    }

    /**
     * Find an existing D1 database by name
     */
    private async findD1Database(databaseName: string): Promise<{ uuid: string; name: string } | null> {
        try {
            const url = `${this.baseUrl}/accounts/${this.accountId}/d1/database`;
            const response = await fetch(url, {
                method: 'GET',
                headers: this.getHeaders(),
            });

            if (!response.ok) {
                return null;
            }

            const data = await response.json() as { result?: Array<{ uuid: string; name: string }> };
            const databases = data.result || [];
            return databases.find((db) => db.name === databaseName) || null;
        } catch (error) {
            this.logger.error('Failed to list D1 databases', error);
            return null;
        }
    }

    /**
     * Provision an R2 bucket for an app
     */
    private async provisionR2Bucket(
        appId: string,
        _userId: string
    ): Promise<PlatformServices['storage']> {
        const bucketName = `app-${appId}-storage`.toLowerCase().replace(/[^a-z0-9-]/g, '-');
        const bindingName = 'STORAGE'; // Standard binding name

        try {
            // Create R2 bucket via Cloudflare API
            const url = `${this.baseUrl}/accounts/${this.accountId}/r2/buckets`;
            const response = await fetch(url, {
                method: 'POST',
                headers: this.getHeaders('application/json'),
                body: JSON.stringify({ name: bucketName }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ errors: [{ message: 'Unknown error' }] })) as { errors?: Array<{ message?: string }> };
                const errorMessage = errorData.errors?.[0]?.message || `HTTP ${response.status}`;
                
                // If bucket already exists, that's okay - we can use it
                if (errorMessage.includes('already exists') || response.status === 409) {
                    this.logger.info('R2 bucket already exists, reusing', { bucketName });
                    return {
                        type: 'r2',
                        bucketName,
                        bindingName,
                    };
                }
                throw new Error(`Failed to create R2 bucket: ${errorMessage}`);
            }

            this.logger.info('R2 bucket created', {
                appId,
                bucketName,
            });

            return {
                type: 'r2',
                bucketName,
                bindingName,
            };
        } catch (error) {
            this.logger.error('Failed to create R2 bucket', error);
            throw error;
        }
    }

    /**
     * Clean up services when app is deleted
     */
    async cleanupServicesForApp(services: PlatformServices): Promise<void> {
        try {
            // Clean up D1 database
            if (services.database?.databaseId) {
                try {
                    const url = `${this.baseUrl}/accounts/${this.accountId}/d1/database/${services.database.databaseId}`;
                    const response = await fetch(url, {
                        method: 'DELETE',
                        headers: this.getHeaders(),
                    });

                    if (response.ok) {
                        this.logger.info('D1 database deleted', {
                            databaseId: services.database.databaseId,
                        });
                    } else {
                        this.logger.warn('Failed to delete D1 database', {
                            databaseId: services.database.databaseId,
                            status: response.status,
                        });
                    }
                } catch (error) {
                    this.logger.error('Failed to delete D1 database', error);
                    // Continue with other cleanup even if this fails
                }
            }

            // Clean up R2 bucket
            if (services.storage?.bucketName) {
                try {
                    // Note: R2 buckets need to be empty before deletion
                    // For now, we'll just log - full cleanup can be implemented later
                    this.logger.info('R2 bucket cleanup (manual deletion may be required)', {
                        bucketName: services.storage.bucketName,
                    });
                    // TODO: Implement R2 bucket deletion after ensuring it's empty
                } catch (error) {
                    this.logger.error('Failed to delete R2 bucket', error);
                }
            }
        } catch (error) {
            this.logger.error('Error during service cleanup', error);
            // Don't throw - cleanup failures shouldn't block app deletion
        }
    }
}

