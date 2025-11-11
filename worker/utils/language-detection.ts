/**
 * Language detection utilities for Arabic and other languages
 */

/**
 * Detect if text contains Arabic characters
 * Arabic Unicode range: U+0600 to U+06FF
 */
export function isArabic(text: string): boolean {
	if (!text || text.trim().length === 0) {
		return false;
	}

	// Check for Arabic characters
	const arabicRegex = /[\u0600-\u06FF]/;
	return arabicRegex.test(text);
}

/**
 * Detect the primary language of the text
 * Returns 'ar-SA' for Arabic, 'en' for English (default)
 */
export function detectLanguage(text: string): 'ar-SA' | 'en' {
	if (isArabic(text)) {
		return 'ar-SA';
	}
	return 'en';
}

/**
 * Check if text is likely Saudi dialect
 * This is a simple heuristic - can be enhanced with more sophisticated detection
 */
export function isSaudiDialect(text: string): boolean {
	if (!isArabic(text)) {
		return false;
	}

	// Common Saudi dialect markers (can be expanded)
	const saudiMarkers = [
		'إيش', // "what" in Saudi dialect
		'وش', // "what" alternative
		'وين', // "where" in Saudi dialect
		'كيفك', // "how are you" in Saudi dialect
		'الله', // Common in Saudi expressions
		'يالله', // "come on" in Saudi dialect
	];

	const lowerText = text.toLowerCase();
	return saudiMarkers.some(marker => lowerText.includes(marker));
}

/**
 * Get language preference from user or detect from text
 */
export function getLanguagePreference(
	userLanguage?: string | null,
	text?: string
): 'ar-SA' | 'en' {
	// If user has a language preference, use it
	if (userLanguage === 'ar-SA' || userLanguage === 'en') {
		return userLanguage;
	}

	// Otherwise, detect from text if provided
	if (text) {
		return detectLanguage(text);
	}

	// Default to English
	return 'en';
}

