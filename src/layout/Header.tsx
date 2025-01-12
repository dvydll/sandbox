const EDITOR_LANGUAGES: string[] = [
	'json',
	'javascript',
	'typescript',
	'html',
] as const;

type HeaderProps = React.HtmlHTMLAttributes<HTMLDivElement>;
export const Header = ({ children, ...props }: HeaderProps) => {
	return <header {...props}>{children}</header>;
};

type HeaderTitleProps = React.HtmlHTMLAttributes<HTMLDivElement> & {
	title: string;
};
const HeaderTitle = ({ title, children, ...props }: HeaderTitleProps) => {
	return (
		<h1 {...props}>
			{title}
			{children}
		</h1>
	);
};

type HeaderLanguageProps = {
	editorLang: string;
	setEditorLang: React.Dispatch<React.SetStateAction<string>>;
};
const HeaderLanguage = ({ editorLang, setEditorLang }: HeaderLanguageProps) => {
	return (
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
		</menu>
	);
};

type HeaderThemeProps = {
	theme: string;
	setTheme: React.Dispatch<React.SetStateAction<string>>;
	themelist: Record<string, string>;
};
const HeaderTheme = ({ theme, setTheme, themelist }: HeaderThemeProps) => {
	return (
		<label>
			<span className='sr-only'>Theme</span>
			<select
				name='theme'
				value={theme}
				onChange={(e) =>
					setTheme((prev) => (prev !== e.target.value ? e.target.value : prev))
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
	);
};

Header.Title = HeaderTitle;
Header.Language = HeaderLanguage;
Header.Theme = HeaderTheme;
