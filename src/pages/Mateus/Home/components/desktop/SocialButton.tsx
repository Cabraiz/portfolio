import { Image } from "react-bootstrap";
import { normalizeTooltipClassName } from "../../utils/home.utils";

export type SocialButtonProps = Readonly<{
	href: string;
	icon: string;
	alt: string;
	isScrollToTop?: boolean;
	imageClassName?: string;
}>;

function joinClasses(
	...classes: Array<string | undefined | null | false>
): string {
	return classes.filter(Boolean).join(" ");
}

export default function SocialButton({
	href,
	icon,
	alt,
	isScrollToTop,
	imageClassName,
}: SocialButtonProps) {
	const normalizedTooltipClass = normalizeTooltipClassName(alt);

	return (
		<a
			href={href}
			target="_blank"
			rel="noopener noreferrer"
			className="social-wrapper"
			aria-label={alt}
		>
			<div
				className={joinClasses(
					"social-link",
					isScrollToTop && "scrollToTopButton"
				)}
			>
				<Image
					className={joinClasses("imagesize", imageClassName)}
					src={icon}
					alt={alt}
				/>
			</div>

			<div className={`tooltip-custom tooltip-${normalizedTooltipClass}`}>
				{alt}
			</div>
		</a>
	);
}
