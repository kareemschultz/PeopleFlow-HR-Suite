"use client";

import type * as React from "react";

import { cn } from "@/lib/utils";

interface LabelProps extends React.ComponentProps<"label"> {
	htmlFor?: string;
}

function Label({ className, htmlFor, ...props }: LabelProps) {
	return (
		// biome-ignore lint/a11y/noLabelWithoutControl: htmlFor is passed as prop
		<label
			className={cn(
				"flex select-none items-center gap-2 text-xs leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-50 group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50",
				className
			)}
			data-slot="label"
			htmlFor={htmlFor}
			{...props}
		/>
	);
}

export { Label };
