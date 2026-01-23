import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
	Clock03Icon,
	CircleLockCheck02Icon as ClockCheckIcon,
	Location01Icon,
	NoteIcon,
} from "hugeicons-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useOrganization } from "@/hooks/use-organization";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/time-attendance/clock")({
	component: ClockPage,
});

function ClockPage() {
	const { organizationId, hasOrganization } = useOrganization();
	const queryClient = useQueryClient();

	const [notes, setNotes] = useState("");
	const [location, setLocation] = useState<{
		latitude: number;
		longitude: number;
	} | null>(null);
	const [gettingLocation, setGettingLocation] = useState(false);

	// Get active time entry
	const { data: activeEntry, isLoading } = useQuery({
		...orpc.timeAttendance.getActiveEntry.queryOptions({
			input: { employeeId: "current" }, // TODO: Get from user session
		}),
		enabled: hasOrganization && !!organizationId,
	});

	// Clock In mutation
	const clockInMutation = useMutation({
		...orpc.timeAttendance.clockIn.mutationOptions(),
		onSuccess: () => {
			toast.success("Clocked In", {
				description: `Successfully clocked in at ${new Date().toLocaleTimeString()}`,
			});
			queryClient.invalidateQueries({ queryKey: ["time-entries"] });
			setNotes("");
			setLocation(null);
		},
		onError: (error) => {
			toast.error("Clock In Failed", {
				description: error.message,
			});
		},
	});

	// Clock Out mutation
	const clockOutMutation = useMutation({
		...orpc.timeAttendance.clockOut.mutationOptions(),
		onSuccess: () => {
			toast.success("Clocked Out", {
				description: `Successfully clocked out at ${new Date().toLocaleTimeString()}`,
			});
			queryClient.invalidateQueries({ queryKey: ["time-entries"] });
			setNotes("");
			setLocation(null);
		},
		onError: (error) => {
			toast.error("Clock Out Failed", {
				description: error.message,
			});
		},
	});

	// Get current location
	const getCurrentLocation = () => {
		setGettingLocation(true);
		if (navigator.geolocation) {
			navigator.geolocation.getCurrentPosition(
				(position) => {
					setLocation({
						latitude: position.coords.latitude,
						longitude: position.coords.longitude,
					});
					setGettingLocation(false);
					toast.success("Location Captured", {
						description: "Your location has been recorded",
					});
				},
				(error) => {
					setGettingLocation(false);
					toast.error("Location Failed", {
						description: error.message,
					});
				}
			);
		} else {
			setGettingLocation(false);
			toast.error("Location Not Supported", {
				description: "Your browser doesn't support geolocation",
			});
		}
	};

	if (isLoading) {
		return (
			<div className="flex h-[calc(100vh-200px)] items-center justify-center">
				<div className="text-center">
					<Clock03Icon className="mx-auto mb-4 h-12 w-12 animate-spin" />
					<p className="text-muted-foreground">Loading...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="mx-auto max-w-2xl space-y-6">
			<div className="text-center">
				<h1 className="font-bold text-3xl">Clock In/Out</h1>
				<p className="text-muted-foreground">Record your work hours</p>
			</div>

			{/* Current Status */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<ClockCheckIcon className="h-5 w-5" />
						Current Status
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="py-8 text-center">
						{activeEntry ? (
							<div className="space-y-4">
								<div className="inline-flex h-24 w-24 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
									<ClockCheckIcon className="h-12 w-12 text-green-600 dark:text-green-400" />
								</div>
								<div>
									<h3 className="font-bold text-2xl text-green-600 dark:text-green-400">
										Clocked In
									</h3>
									<p className="text-muted-foreground">
										Since {new Date(activeEntry.clockIn).toLocaleTimeString()}
									</p>
									<p className="mt-2 text-muted-foreground text-sm">
										Duration:{" "}
										{Math.floor(
											(Date.now() - new Date(activeEntry.clockIn).getTime()) /
												(1000 * 60)
										)}{" "}
										minutes
									</p>
								</div>
							</div>
						) : (
							<div className="space-y-4">
								<div className="inline-flex h-24 w-24 items-center justify-center rounded-full bg-muted">
									<Clock03Icon className="h-12 w-12 text-muted-foreground" />
								</div>
								<div>
									<h3 className="font-bold text-2xl">Clocked Out</h3>
									<p className="text-muted-foreground">
										Ready to start your work day
									</p>
								</div>
							</div>
						)}
					</div>
				</CardContent>
			</Card>

			{/* Clock In/Out Form */}
			<Card>
				<CardHeader>
					<CardTitle>{activeEntry ? "Clock Out" : "Clock In"}</CardTitle>
					<CardDescription>
						{activeEntry
							? "End your work day and record any breaks taken"
							: "Start your work day and optionally record your location"}
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					{/* Location */}
					<div className="space-y-2">
						<Label className="flex items-center gap-2">
							<Location01Icon className="h-4 w-4" />
							Location (Optional)
						</Label>
						<div className="flex gap-2">
							<Input
								placeholder="No location recorded"
								readOnly
								value={
									location
										? `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`
										: ""
								}
							/>
							<Button
								disabled={gettingLocation}
								onClick={getCurrentLocation}
								type="button"
								variant="outline"
							>
								{gettingLocation ? "Getting..." : "Get Location"}
							</Button>
						</div>
						<p className="text-muted-foreground text-xs">
							Recording your location helps verify your attendance
						</p>
					</div>

					{/* Notes */}
					<div className="space-y-2">
						<Label className="flex items-center gap-2">
							<NoteIcon className="h-4 w-4" />
							Notes (Optional)
						</Label>
						<Textarea
							onChange={(e) => setNotes(e.target.value)}
							placeholder={
								activeEntry
									? "Add any notes about your work day..."
									: "Add any notes about your shift..."
							}
							rows={3}
							value={notes}
						/>
					</div>

					{/* Break Duration (for clock out only) */}
					{activeEntry && (
						<div className="space-y-2">
							<Label>Break Duration (minutes)</Label>
							<Input
								defaultValue="0"
								id="breakDuration"
								min="0"
								type="number"
							/>
							<p className="text-muted-foreground text-xs">
								Enter the total minutes of breaks taken during your shift
							</p>
						</div>
					)}

					{/* Action Button */}
					<Button
						className="w-full"
						disabled={clockInMutation.isPending || clockOutMutation.isPending}
						onClick={() => {
							if (!organizationId) {
								return;
							}
							if (activeEntry) {
								const breakDuration =
									Number(
										document.querySelector<HTMLInputElement>("#breakDuration")
											?.value
									) || 0;
								clockOutMutation.mutate({
									entryId: activeEntry.id,
									latitude: location?.latitude,
									longitude: location?.longitude,
									breakDuration,
									notes: notes || undefined,
								});
							} else {
								clockInMutation.mutate({
									employeeId: "current", // TODO: Get from user session
									organizationId,
									latitude: location?.latitude,
									longitude: location?.longitude,
									location: location ? "Recorded location" : undefined,
									notes: notes || undefined,
								});
							}
						}}
						size="lg"
					>
						{activeEntry ? (
							<>
								<ClockCheckIcon className="mr-2 h-5 w-5" />
								Clock Out
							</>
						) : (
							<>
								<Clock03Icon className="mr-2 h-5 w-5" />
								Clock In
							</>
						)}
					</Button>
				</CardContent>
			</Card>

			{/* Help Text */}
			<Card className="bg-muted">
				<CardContent className="pt-6">
					<h4 className="mb-2 font-semibold">Tips:</h4>
					<ul className="list-inside list-disc space-y-1 text-muted-foreground text-sm">
						<li>Always clock in when you arrive at work</li>
						<li>Record your location for attendance verification</li>
						<li>Remember to clock out when leaving, including break time</li>
						<li>
							Add notes if you're working overtime or have special circumstances
						</li>
					</ul>
				</CardContent>
			</Card>
		</div>
	);
}
