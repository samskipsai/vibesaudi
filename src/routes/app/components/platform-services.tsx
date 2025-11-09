import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Database, HardDrive, ExternalLink, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import type { PlatformServices } from 'worker/services/platform-services/PlatformServicesManager';
import { cn } from '@/lib/utils';

interface PlatformServicesProps {
	services?: PlatformServices | null;
}

export function PlatformServicesView({ services }: PlatformServicesProps) {
	const [copiedField, setCopiedField] = useState<string | null>(null);

	const handleCopy = (text: string, fieldName: string) => {
		navigator.clipboard.writeText(text);
		setCopiedField(fieldName);
		setTimeout(() => setCopiedField(null), 2000);
		toast.success('Copied to clipboard');
	};

	if (!services || (!services.database && !services.storage)) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Platform Services</CardTitle>
					<CardDescription>
						No platform services have been provisioned for this app.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<p className="text-sm text-muted-foreground">
						Platform services like databases and storage can be added when creating a new app.
					</p>
				</CardContent>
			</Card>
		);
	}

	return (
		<div className="space-y-4">
			{services.database && (
				<Card>
					<CardHeader>
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-3">
								<div className="rounded-lg bg-blue-100 dark:bg-blue-900/30 p-2">
									<Database className="h-5 w-5 text-blue-600 dark:text-blue-400" />
								</div>
								<div>
									<CardTitle className="text-lg">D1 Database</CardTitle>
									<CardDescription>
										Cloudflare D1 SQLite database
									</CardDescription>
								</div>
							</div>
							<Badge variant="outline" className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800">
								Active
							</Badge>
						</div>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="grid gap-4">
							<div className="space-y-2">
								<label className="text-sm font-medium text-muted-foreground">
									Database Name
								</label>
								<div className="flex items-center gap-2">
									<code className="flex-1 px-3 py-2 bg-muted rounded-md text-sm font-mono">
										{services.database.databaseName}
									</code>
									<Button
										variant="ghost"
										size="sm"
										onClick={() => handleCopy(services.database!.databaseName, 'db-name')}
										className="h-8 w-8 p-0"
									>
										{copiedField === 'db-name' ? (
											<Check className="h-4 w-4" />
										) : (
											<Copy className="h-4 w-4" />
										)}
									</Button>
								</div>
							</div>

							<div className="space-y-2">
								<label className="text-sm font-medium text-muted-foreground">
									Binding Name
								</label>
								<div className="flex items-center gap-2">
									<code className="flex-1 px-3 py-2 bg-muted rounded-md text-sm font-mono">
										{services.database.bindingName}
									</code>
									<Button
										variant="ghost"
										size="sm"
										onClick={() => handleCopy(services.database!.bindingName, 'db-binding')}
										className="h-8 w-8 p-0"
									>
										{copiedField === 'db-binding' ? (
											<Check className="h-4 w-4" />
										) : (
											<Copy className="h-4 w-4" />
										)}
									</Button>
								</div>
								<p className="text-xs text-muted-foreground">
									Use <code className="px-1 py-0.5 bg-muted rounded text-xs">env.{services.database.bindingName}</code> to access the database in your Worker code.
								</p>
							</div>

							{services.database.databaseId && (
								<div className="space-y-2">
									<label className="text-sm font-medium text-muted-foreground">
										Database ID
									</label>
									<div className="flex items-center gap-2">
										<code className="flex-1 px-3 py-2 bg-muted rounded-md text-sm font-mono truncate">
											{services.database.databaseId}
										</code>
										<Button
											variant="ghost"
											size="sm"
											onClick={() => handleCopy(services.database!.databaseId!, 'db-id')}
											className="h-8 w-8 p-0"
										>
											{copiedField === 'db-id' ? (
												<Check className="h-4 w-4" />
											) : (
												<Copy className="h-4 w-4" />
											)}
										</Button>
									</div>
								</div>
							)}

							<div className="pt-2 border-t">
								<Button
									variant="outline"
									size="sm"
									onClick={() => {
										window.open(
											`https://dash.cloudflare.com/?to=/:account/d1/databases/${services.database!.databaseId || services.database!.databaseName}`,
											'_blank',
											'noopener,noreferrer'
										);
									}}
									className="gap-2"
								>
									<ExternalLink className="h-4 w-4" />
									Open in Cloudflare Dashboard
								</Button>
							</div>
						</div>
					</CardContent>
				</Card>
			)}

			{services.storage && (
				<Card>
					<CardHeader>
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-3">
								<div className="rounded-lg bg-purple-100 dark:bg-purple-900/30 p-2">
									<HardDrive className="h-5 w-5 text-purple-600 dark:text-purple-400" />
								</div>
								<div>
									<CardTitle className="text-lg">R2 Storage</CardTitle>
									<CardDescription>
										Cloudflare R2 object storage bucket
									</CardDescription>
								</div>
							</div>
							<Badge variant="outline" className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800">
								Active
							</Badge>
						</div>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="grid gap-4">
							<div className="space-y-2">
								<label className="text-sm font-medium text-muted-foreground">
									Bucket Name
								</label>
								<div className="flex items-center gap-2">
									<code className="flex-1 px-3 py-2 bg-muted rounded-md text-sm font-mono">
										{services.storage.bucketName}
									</code>
									<Button
										variant="ghost"
										size="sm"
										onClick={() => handleCopy(services.storage!.bucketName, 'bucket-name')}
										className="h-8 w-8 p-0"
									>
										{copiedField === 'bucket-name' ? (
											<Check className="h-4 w-4" />
										) : (
											<Copy className="h-4 w-4" />
										)}
									</Button>
								</div>
							</div>

							<div className="space-y-2">
								<label className="text-sm font-medium text-muted-foreground">
									Binding Name
								</label>
								<div className="flex items-center gap-2">
									<code className="flex-1 px-3 py-2 bg-muted rounded-md text-sm font-mono">
										{services.storage.bindingName}
									</code>
									<Button
										variant="ghost"
										size="sm"
										onClick={() => handleCopy(services.storage!.bindingName, 'storage-binding')}
										className="h-8 w-8 p-0"
									>
										{copiedField === 'storage-binding' ? (
											<Check className="h-4 w-4" />
										) : (
											<Copy className="h-4 w-4" />
										)}
									</Button>
								</div>
								<p className="text-xs text-muted-foreground">
									Use <code className="px-1 py-0.5 bg-muted rounded text-xs">env.{services.storage.bindingName}</code> to access the bucket in your Worker code.
								</p>
							</div>

							<div className="pt-2 border-t">
								<Button
									variant="outline"
									size="sm"
									onClick={() => {
										window.open(
											`https://dash.cloudflare.com/?to=/:account/r2/buckets/${services.storage!.bucketName}`,
											'_blank',
											'noopener,noreferrer'
										);
									}}
									className="gap-2"
								>
									<ExternalLink className="h-4 w-4" />
									Open in Cloudflare Dashboard
								</Button>
							</div>
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	);
}

