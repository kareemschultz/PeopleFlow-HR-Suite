import { Loading03Icon } from "hugeicons-react";

export default function Loader() {
	return (
		<div className="flex h-full items-center justify-center pt-8">
			<Loading03Icon className="animate-spin" />
		</div>
	);
}
