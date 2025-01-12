import {
	Editor as MonacoEditor,
	type Monaco,
	type EditorProps as MonacoEditorProps,
	type OnChange,
	type OnMount,
} from '@monaco-editor/react';
import { editor } from 'monaco-editor';
import { useCallback, useEffect, useMemo, useRef } from 'react';

import editorOptions from '@/assets/options/editor.config.json';
import themelist from '@/assets/themes/editor/themelist.json';

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

export type EditorProps = MonacoEditorProps & {
	output: string;
	readOnly: boolean;
	setValue: React.Dispatch<React.SetStateAction<string>>;
	setOutput: React.Dispatch<React.SetStateAction<string>>;
	setTheme: React.Dispatch<React.SetStateAction<string>>;
};
export const Editor = ({
	theme,
	language,
	value,
	readOnly,
	setValue,
	setOutput,
	...props
}: EditorProps) => {
	const originalConsole = useRef(console);

	useEffect(() => {
		const consoleObject = originalConsole.current;
		const consoleProxy = new Proxy(console, {
			get:
				(target, prop: keyof Console) =>
				(...args: unknown[]) => {
					if (typeof target[prop] === 'function')
						setOutput(
							(prevState: string) =>
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
	}, [setOutput]);

	const handleEditorMount = useCallback<OnMount>(
		(_, monaco: Monaco) => {
			Object.entries(availableThemes).forEach(([themeName, themeData]) => {
				monaco.editor.defineTheme(themeName, themeData);
			});
			monaco.editor.setTheme(theme ?? 'vs-dark');
		},
		[theme]
	);

	const handleEditorChange = useCallback<OnChange>(
		(newValue) => {
			setValue(newValue ?? '');
			try {
				const result = eval(newValue ?? ''); // Evalúa el código.
				setOutput((prev: string) =>
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

	const editorProps: MonacoEditorProps = useMemo(
		() => ({
			defaultValue: value,
			theme: theme,
			defaultLanguage: language,
			options: {
				...editorOptions,
				...(readOnly && { readOnly: true }),
			} as MonacoEditorProps['options'],
			onMount: handleEditorMount,
			onChange: handleEditorChange,
			...props,
		}),
		[
			value,
			language,
			theme,
			readOnly,
			props,
			handleEditorMount,
			handleEditorChange,
		]
	);

	return <MonacoEditor {...editorProps} />;
};
