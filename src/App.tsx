import { useMemo, useState } from 'react';

import { Editor, type EditorProps } from '@/components/Editor';
import { Header } from '@/layout/Header';
import { ResizableSplitter as Splitter } from '@/layout/ResizableSplitter';

import editorOptions from '@/assets/options/editor.config.json';
import themelist from '@/assets/themes/editor/themelist.json';

import './App.module.css';

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
	const [theme, setTheme] = useState('vs-dark');
	const [editorLang, setEditorLang] = useState<string>('javascript');

	const editorProps: EditorProps = useMemo(
		() =>
			({
				theme,
				language: editorLang,
				value,
				setValue,
				setOutput,
			} as EditorProps),
		[value, editorLang, theme]
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
			<Editor {...editorProps} language={'shell'} value={output} readOnly />
		),
		typescript: (
			<Editor {...editorProps} language={'shell'} value={output} readOnly />
		),
	};

	return (
		<>
			<Header className='flex flex-row gap-3 items-center justify-between w-dvw h-10 px-2 py-1 bg-zinc-900'>
				<Header.Title
					title='Web Sandbox'
					className='text-lg text-neutral-400 font-bold'
				>
					<small className='text-xs text-gray-500 ms-2 self-baseline'>
						with React & Monaco
					</small>
				</Header.Title>
				<menu className='flex flex-row gap-3 items-center'>
					<Header.Language
						editorLang={editorLang}
						setEditorLang={setEditorLang}
					/>
					<Header.Theme
						theme={theme}
						setTheme={setTheme}
						themelist={themelist}
					/>
				</menu>
			</Header>

			<main className='flex flex-row w-dvw h-dvh'>
				<Splitter>
					<Splitter.Panel>
						<Editor {...editorProps} />
					</Splitter.Panel>
					<Splitter.Divider className='w-5 h-full cursor-col-resize bg-zinc-900 hover:bg-green-400' />
					<Splitter.Panel>{outputTabs[editorLang] ?? null}</Splitter.Panel>
				</Splitter>
			</main>
		</>
	);
};
