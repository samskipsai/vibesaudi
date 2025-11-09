import { useState } from 'react';
import { Database, HardDrive } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { ServicePreferences } from 'worker/services/platform-services/PlatformServicesManager';

interface ServiceSelectionProps {
	onChange: (services: ServicePreferences) => void;
	defaultServices?: ServicePreferences;
}

export function ServiceSelection({ onChange, defaultServices }: ServiceSelectionProps) {
	const [includeDatabase, setIncludeDatabase] = useState(defaultServices?.includeDatabase ?? false);
	const [includeStorage, setIncludeStorage] = useState(defaultServices?.includeStorage ?? false);

	const handleDatabaseChange = (checked: boolean) => {
		setIncludeDatabase(checked);
		onChange({
			includeDatabase: checked,
			includeStorage,
		});
	};

	const handleStorageChange = (checked: boolean) => {
		setIncludeStorage(checked);
		onChange({
			includeDatabase,
			includeStorage: checked,
		});
	};

	return (
		<Card className="border-border/50">
			<CardHeader>
				<CardTitle className="text-sm font-medium">Platform Services</CardTitle>
				<CardDescription className="text-xs">
					Add built-in backend services to your app
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="flex items-start space-x-3">
					<Checkbox
						id="database"
						checked={includeDatabase}
						onCheckedChange={handleDatabaseChange}
						className="mt-1"
					/>
					<div className="flex-1 space-y-1">
						<Label
							htmlFor="database"
							className="flex items-center gap-2 text-sm font-medium cursor-pointer"
						>
							<Database className="h-4 w-4" />
							D1 Database
						</Label>
						<p className="text-xs text-muted-foreground">
							Serverless SQLite database for storing app data. Perfect for user data, content, and application state.
						</p>
					</div>
				</div>

				<div className="flex items-start space-x-3">
					<Checkbox
						id="storage"
						checked={includeStorage}
						onCheckedChange={handleStorageChange}
						className="mt-1"
					/>
					<div className="flex-1 space-y-1">
						<Label
							htmlFor="storage"
							className="flex items-center gap-2 text-sm font-medium cursor-pointer"
						>
							<HardDrive className="h-4 w-4" />
							R2 Storage
						</Label>
						<p className="text-xs text-muted-foreground">
							Object storage for files, images, and media. Ideal for user uploads, static assets, and large files.
						</p>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}

