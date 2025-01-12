import { Children, isValidElement, useRef, useState } from 'react';

type ResizableSplitterProps = React.HtmlHTMLAttributes<HTMLDivElement> & {
	children: React.ReactNode;
};
export const ResizableSplitter = ({
	children,
	...props
}: ResizableSplitterProps) => {
	const containerRef = useRef<HTMLDivElement>(null);
	// const [widths, setWidths] = useState({ left: 50, right: 50 });
	const [widths, setWidths] = useState<{ [k in number]: number }>(() => {
		const splitterPanels = Children.toArray(children).filter(
			(child): child is React.ReactElement =>
				isValidElement(child) && child.type === ResizableSplitter.Panel
		);
		const sizesEntries = Children.map(children, (child, index) => {
			if (isValidElement(child) && child.type === ResizableSplitter.Panel) {
				return { [index]: 100 / splitterPanels.length };
			}
		})?.flatMap(Object.entries);
		return Object.fromEntries(sizesEntries ?? []);
	});

	const processedChildren = Children.map(children, (child, index) => {
		if (!isValidElement(child)) return;

		// Procesar el Divider
		if (child.type === ResizableSplitter.Divider) {
			return (
				<ResizableSplitter.Divider
					{...child.props}
					containerRef={containerRef}
					setWidths={setWidths}
					position={index}
				/>
			);
		}

		// Procesar los Paneles
		if (child.type === ResizableSplitter.Panel) {
			const panelStyle = {
				flexBasis: `${widths[index]}%`,
				flexGrow: 0,
				flexShrink: 0,
			};
			// const panelStyle =
			// 	index === 0
			// 		? { flexBasis: `${widths.left}%`, flexGrow: 0, flexShrink: 0 }
			// 		: { flexBasis: `${widths.right}%`, flexGrow: 0, flexShrink: 0 };

			return (
				<ResizableSplitter.Panel {...child.props} style={{ ...panelStyle }}>
					{child.props.children}
				</ResizableSplitter.Panel>
			);
		}
	});

	return (
		<section
			ref={containerRef}
			style={{
				...props.style,
				display: 'flex',
				flexDirection: 'row',
				height: '100%',
				width: '100%',
			}}
		>
			{processedChildren}
		</section>
	);
};

type SplitterPanelProps = React.HtmlHTMLAttributes<HTMLDivElement> & {
	children: React.ReactNode;
};
const SplitterPanel = ({ children, style, ...props }: SplitterPanelProps) => {
	return (
		<article {...props} style={{ ...style, overflow: 'auto' }}>
			{children}
		</article>
	);
};

type SplitterDividerProps = React.HtmlHTMLAttributes<HTMLDivElement> & {
	// setWidths?: React.Dispatch<SetStateAction<{ left: number; right: number }>>;
	setWidths?: React.Dispatch<React.SetStateAction<{ [k in number]: number }>>;
	position?: number;
	containerRef?: React.RefObject<HTMLDivElement>;
};
const SplitterDivider = ({
	setWidths,
	containerRef,
	position,
	...props
}: SplitterDividerProps) => {
	const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
		if (!containerRef?.current || !setWidths) return;

		const containerWidth = containerRef.current.offsetWidth;
		const startX = e.clientX;

		const onMouseMove = (e: MouseEvent) => {
			const deltaX = e.clientX - startX;
			const deltaPercent = (deltaX / containerWidth) * 100;

			setWidths((prev) => {
				const newLeft = Math.max(
					10,
					Math.min(90, prev[position ?? -1] + deltaPercent)
				);
				// const newLeft = Math.max(10, Math.min(90, prev.left + deltaPercent));
				const newRight = 100 - newLeft;
				// return { left: newLeft, right: newRight };
				console.debug({
					prev,
					new: { ...prev, [position! - 1]: newLeft, [position! + 1]: newRight },
				});
				return { ...prev, [position! - 1]: newLeft, [position! + 1]: newRight };
			});
		};

		const onMouseUp = () => {
			document.removeEventListener('mousemove', onMouseMove);
			document.removeEventListener('mouseup', onMouseUp);
		};

		document.addEventListener('mousemove', onMouseMove);
		document.addEventListener('mouseup', onMouseUp);
	};

	return <div {...props} onMouseDown={handleMouseDown} />;
};

// Asociar los subcomponentes
ResizableSplitter.Panel = SplitterPanel;
ResizableSplitter.Divider = SplitterDivider;
