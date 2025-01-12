import {
	Editor,
	type EditorProps,
	type Monaco,
	type OnChange,
	type OnMount,
} from '@monaco-editor/react';
import { editor } from 'monaco-editor';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import editorOptions from '@/assets/options/editor.config.json';
import themelist from '@/assets/themes/editor/themelist.json';

import './App.module.css';

// Import all themes concurrently
const availableThemes: { [x: string]: editor.IStandaloneThemeData } =
	Object.fromEntries(
		await Promise.all(
			Object.entries(themelist).map(async ([themeName, fileName]) => {
				const themeData = await import(
					`@/assets/themes/editor/${fileName}.json`
				);
				return [themeName, themeData.default as editor.IStandaloneThemeData];
			})
		)
	);

const EDITOR_LANGUAGES: string[] = [
	'json',
	'javascript',
	'typescript',
	'html',
] as const;

export const App = () => {
	const [value, setValue] = useState<string>(
		`(${JSON.stringify(editorOptions, null, 2)});`
	);
	const [output, setOutput] = useState<string>(() => {
		try {
			const result = eval(value ?? ''); // Evalúa el código.
			return typeof result === 'object'
				? JSON.stringify(result, null, 2)
				: String(result);
		} catch (error) {
			return String(error);
		}
	});
	const [theme, setTheme] = useState('Tomorrow-Night-Eighties');
	const [editorLang, setEditorLang] = useState<string>('javascript');
	const originalConsole = useRef(console);

	useEffect(() => {
		const consoleObject = originalConsole.current;
		const consoleProxy = new Proxy(console, {
			get:
				(target, prop: keyof Console) =>
				(...args: unknown[]) => {
					if (typeof target[prop] === 'function')
						setOutput(
							(prevState) =>
								`${
									prevState + '\n'
								}[${new Date().toISOString()}] [${prop.toUpperCase()}] ` +
								JSON.stringify(
									[...args, { type: prop, message: args.join(' ') }],
									null,
									2
								)
						);
					// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
					(target[prop] as Function)(...args); // Llamar al método original
				},
		});

		// Reemplazar la consola global
		window.console = consoleProxy;

		// Restaurar la consola original al desmontar
		return () => {
			window.console = consoleObject;
		};
	}, []);

	const handleEditorMount = useCallback<OnMount>(
		(_, monaco: Monaco) => {
			Object.entries(availableThemes).forEach(([themeName, themeData]) => {
				monaco.editor.defineTheme(themeName, themeData);
			});
			monaco.editor.setTheme(theme);
		},
		[theme]
	);
	const handleEditorChange = useCallback<OnChange>(
		(newValue) => {
			setValue(newValue ?? '');
			try {
				const result = eval(newValue ?? ''); // Evalúa el código.
				setOutput((prev) =>
					typeof result === 'object'
						? JSON.stringify(result ?? '{}', null, 2)
						: String(result ?? prev)
				);
			} catch (error) {
				console.error(error);
				setOutput(
					String(
						error instanceof Error
							? `"${error.message} ${error.stack}"`
							: 'Unknown Error'
					)
				); // Captura errores y los muestra.
			}
		},
		[setValue, setOutput]
	);

	const editorProps: EditorProps = useMemo(
		() => ({
			defaultValue: value,
			theme: theme,
			defaultLanguage: editorLang,
			options: editorOptions as EditorProps['options'],
			onMount: handleEditorMount,
			onChange: handleEditorChange,
		}),
		[value, editorLang, theme, handleEditorMount, handleEditorChange]
	);

	const outputTabs: { [x: string]: JSX.Element } = {
		html: <iframe srcDoc={value} />,
		css: (
			<iframe
				srcDoc={
					/* html */ `<!DOCTYPE html>
<html lang="es">
	<head>
		<meta charset="UTF-8" />
		<link rel="icon" type="image/svg+xml" href="/vite.svg" />
		<meta name="viewport" content="width=device-width, initial-scale=1.0" />
		<title>Sandbox</title>
		<style>${value}</style>
	</head>
	<body>
	</body>
</html>`
				}
			/>
		),
		javascript: (
			<Editor
				defaultLanguage={'shell'}
				value={output}
				options={{
					...(editorOptions as EditorProps['options']),
					readOnly: true,
				}}
			/>
		),
		typescript: (
			<Editor
				defaultLanguage={'shell'}
				value={output}
				options={{
					...(editorOptions as EditorProps['options']),
					readOnly: true,
				}}
			/>
		),
	};

	return (
		<>
			<header className='flex flex-row gap-3 items-center justify-between w-dvw h-10 px-2 py-1'>
				<h1 className='text-lg text-neutral-400 font-bold'>
					Web Sandbox
					<small className='text-xs text-gray-500 ms-2 self-baseline'>
						with React & Monaco
					</small>
				</h1>
				<menu className='flex flex-row gap-3 items-center'>
					<label>
						<span className='sr-only'>Language</span>
						<select
							name='language'
							value={editorLang}
							onChange={(e) =>
								setEditorLang((prev) =>
									prev !== e.target.value ? e.target.value : prev
								)
							}
						>
							{EDITOR_LANGUAGES.map((lang) => (
								<option key={lang} value={lang}>
									{lang}
								</option>
							))}
						</select>
					</label>

					<label>
						<span className='sr-only'>Theme</span>
						<select
							name='theme'
							value={theme}
							onChange={(e) =>
								setTheme((prev) =>
									prev !== e.target.value ? e.target.value : prev
								)
							}
						>
							{Object.entries({
								light: 'vs-light',
								'vs-dark': 'vs-dark',
								'hc-black': 'hc-black',
								...themelist,
							}).map(([themeName, label]) => (
								<option key={themeName} value={themeName}>
									{label}
								</option>
							))}
						</select>
					</label>
				</menu>
			</header>

			<main className='flex flex-row w-dvw h-dvh'>
				<Editor {...editorProps} />
				{outputTabs[editorLang] ?? null}
			</main>
		</>
	);
};
