import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';
import { Globe } from 'lucide-react';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

export function LanguageSwitcher() {
	const { i18n } = useTranslation();

	// Initialize language on mount
	useEffect(() => {
		const savedLanguage = localStorage.getItem('i18nextLng') || localStorage.getItem('user_language') || 'en';
		if (i18n.language !== savedLanguage) {
			i18n.changeLanguage(savedLanguage);
		}
		const dir = savedLanguage === 'ar-SA' ? 'rtl' : 'ltr';
		document.documentElement.dir = dir;
		document.documentElement.lang = savedLanguage;
	}, [i18n]);

	const changeLanguage = async (lng: string) => {
		await i18n.changeLanguage(lng);
		
		// Update document direction
		document.documentElement.dir = lng === 'ar-SA' ? 'rtl' : 'ltr';
		document.documentElement.lang = lng;
		
		// Save to localStorage
		localStorage.setItem('i18nextLng', lng);
		localStorage.setItem('user_language', lng);
		
		// Save to user preferences if logged in (via API when backend supports it)
		// For now, we store in localStorage and the backend can read it from Accept-Language header
	};

	const currentLanguage = i18n.language || 'en';

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant="ghost"
					size="icon"
					className="h-9 w-9"
					aria-label="Change language"
				>
					<Globe className="h-4 w-4" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				<DropdownMenuItem
					onClick={() => changeLanguage('en')}
					className={currentLanguage === 'en' ? 'bg-accent' : ''}
				>
					English
				</DropdownMenuItem>
				<DropdownMenuItem
					onClick={() => changeLanguage('ar-SA')}
					className={currentLanguage === 'ar-SA' ? 'bg-accent' : ''}
				>
					العربية
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

