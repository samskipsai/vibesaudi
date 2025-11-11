import type { RouteObject } from 'react-router';
import { lazy, Suspense } from 'react';

import App from './App';
import Home from './routes/home';
import { ProtectedRoute } from './routes/protected-route';

// Lazy load heavy route components for code-splitting
const Chat = lazy(() => import('./routes/chat/chat').then(m => ({ default: m.default })));
const Profile = lazy(() => import('./routes/profile').then(m => ({ default: m.default })));
const Settings = lazy(() => import('./routes/settings/index').then(m => ({ default: m.default })));
const AppsPage = lazy(() => import('./routes/apps').then(m => ({ default: m.default })));
const AppView = lazy(() => import('./routes/app').then(m => ({ default: m.default })));
const DiscoverPage = lazy(() => import('./routes/discover').then(m => ({ default: m.default })));

// Loading fallback component
const RouteLoader = () => (
	<div className="min-h-screen bg-bg-3 flex items-center justify-center">
		<div className="text-center">
			<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto mb-4"></div>
			<p className="text-text-tertiary">Loading...</p>
		</div>
	</div>
);

const routes = [
	{
		path: '/',
		Component: App,
		children: [
			{
				index: true,
				Component: Home,
			},
			{
				path: 'chat/:chatId',
				element: (
					<Suspense fallback={<RouteLoader />}>
						<Chat />
					</Suspense>
				),
			},
			{
				path: 'profile',
				element: (
					<ProtectedRoute>
						<Suspense fallback={<RouteLoader />}>
							<Profile />
						</Suspense>
					</ProtectedRoute>
				),
			},
			{
				path: 'settings',
				element: (
					<ProtectedRoute>
						<Suspense fallback={<RouteLoader />}>
							<Settings />
						</Suspense>
					</ProtectedRoute>
				),
			},
			{
				path: 'apps',
				element: (
					<ProtectedRoute>
						<Suspense fallback={<RouteLoader />}>
							<AppsPage />
						</Suspense>
					</ProtectedRoute>
				),
			},
			{
				path: 'app/:id',
				element: (
					<Suspense fallback={<RouteLoader />}>
						<AppView />
					</Suspense>
				),
			},
			{
				path: 'discover',
				element: (
					<Suspense fallback={<RouteLoader />}>
						<DiscoverPage />
					</Suspense>
				),
			},
		],
	},
] satisfies RouteObject[];

export { routes };
