import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { orpc } from "@/utils/orpc";

function getInitials(name?: string) {
	if (!name) {
		return "??";
	}
	return name
		.split(" ")
		.map((n) => n[0])
		.join("")
		.toUpperCase()
		.slice(0, 2);
}

type MemberRole =
	| "owner"
	| "admin"
	| "hr_manager"
	| "payroll_manager"
	| "manager"
	| "member";

interface Member {
	id: string;
	role: MemberRole;
	joinedAt: Date;
	isActive: boolean;
	user?: {
		name?: string;
		email?: string;
	};
}

export function PermissionsSettings() {
	const [selectedMember, setSelectedMember] = useState<string | null>(null);
	const [isEditOpen, setIsEditOpen] = useState(false);
	const [isRemoveOpen, setIsRemoveOpen] = useState(false);
	const [memberToRemove, setMemberToRemove] = useState<string | null>(null);
	const [newRole, setNewRole] = useState<MemberRole>("member");

	const organizationId = "00000000-0000-0000-0000-000000000000";

	const queryClient = useQueryClient();
	const { data: members, isLoading } = useQuery(
		orpc.organizations.listMembers.queryOptions({
			input: { organizationId },
		})
	);

	const updateMutation = useMutation(
		orpc.organizations.updateMember.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: orpc.organizations.listMembers.key(),
				});
				setIsEditOpen(false);
				toast.success("Member updated successfully");
			},
			onError: (error: Error) => {
				toast.error(`Failed to update member: ${error.message}`);
			},
		})
	);

	const removeMutation = useMutation(
		orpc.organizations.removeMember.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: orpc.organizations.listMembers.key(),
				});
				toast.success("Member removed successfully");
			},
			onError: (error: Error) => {
				toast.error(`Failed to remove member: ${error.message}`);
			},
		})
	);

	const handleEditRole = (memberId: string, currentRole: MemberRole) => {
		setSelectedMember(memberId);
		setNewRole(currentRole);
		setIsEditOpen(true);
	};

	const saveRole = () => {
		if (!selectedMember) {
			return;
		}
		updateMutation.mutate({
			memberId: selectedMember,
			role: newRole,
		});
	};

	const handleRemoveMember = (memberId: string) => {
		setMemberToRemove(memberId);
		setIsRemoveOpen(true);
	};

	const confirmRemoveMember = () => {
		if (memberToRemove) {
			removeMutation.mutate({ memberId: memberToRemove });
			setIsRemoveOpen(false);
			setMemberToRemove(null);
		}
	};

	function renderLoadingRows() {
		return Array.from({ length: 3 }).map((_, i) => (
			<TableRow key={`skeleton-${i.toString()}`}>
				<TableCell>
					<div className="flex items-center gap-3">
						<Skeleton className="h-10 w-10 rounded-full" />
						<div className="space-y-1">
							<Skeleton className="h-4 w-[100px]" />
							<Skeleton className="h-3 w-[140px]" />
						</div>
					</div>
				</TableCell>
				<TableCell>
					<Skeleton className="h-4 w-[80px]" />
				</TableCell>
				<TableCell>
					<Skeleton className="h-4 w-[100px]" />
				</TableCell>
				<TableCell>
					<Skeleton className="h-4 w-[60px]" />
				</TableCell>
				<TableCell>
					<Skeleton className="ml-auto h-8 w-8" />
				</TableCell>
			</TableRow>
		));
	}

	function renderEmptyRow() {
		return (
			<TableRow>
				<TableCell
					className="h-24 text-center text-muted-foreground"
					colSpan={5}
				>
					No members found.
				</TableCell>
			</TableRow>
		);
	}

	function renderMemberRows() {
		return (members as Member[])?.map((m) => (
			<TableRow key={m.id}>
				<TableCell>
					<div className="flex items-center gap-3">
						<div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 font-medium text-primary">
							{getInitials(m.user?.name)}
						</div>
						<div>
							<div className="font-medium">
								{m.user?.name ?? "Unknown User"}
							</div>
							<div className="text-muted-foreground text-xs">
								{m.user?.email}
							</div>
						</div>
					</div>
				</TableCell>
				<TableCell>
					<Badge className="capitalize" variant="outline">
						{m.role.replace("_", " ")}
					</Badge>
				</TableCell>
				<TableCell>{format(new Date(m.joinedAt), "MMM d, yyyy")}</TableCell>
				<TableCell>
					<Badge variant={m.isActive ? "default" : "secondary"}>
						{m.isActive ? "Active" : "Inactive"}
					</Badge>
				</TableCell>
				<TableCell className="text-right">
					<div className="flex justify-end gap-2">
						<Button
							onClick={() => handleEditRole(m.id, m.role)}
							size="sm"
							variant="ghost"
						>
							Edit
						</Button>
						<Button
							className="text-destructive hover:bg-destructive/10 hover:text-destructive"
							onClick={() => handleRemoveMember(m.id)}
							size="sm"
							variant="ghost"
						>
							Remove
						</Button>
					</div>
				</TableCell>
			</TableRow>
		));
	}

	function renderTableContent() {
		if (isLoading) {
			return renderLoadingRows();
		}
		if (!members || members.length === 0) {
			return renderEmptyRow();
		}
		return renderMemberRows();
	}

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h3 className="font-medium text-lg">Members & Permissions</h3>
					<p className="text-muted-foreground text-sm">
						Manage access and roles for your organization members.
					</p>
				</div>
				<Button disabled>Invite Member (Coming Soon)</Button>
			</div>

			<Dialog onOpenChange={setIsEditOpen} open={isEditOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Edit Member Role</DialogTitle>
					</DialogHeader>
					<div className="space-y-4 py-4">
						<div className="space-y-2">
							<Label>Role</Label>
							<Select
								onValueChange={(value) => setNewRole(value as MemberRole)}
								value={newRole}
							>
								<SelectTrigger>
									<SelectValue placeholder="Select a role" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="owner">Owner</SelectItem>
									<SelectItem value="admin">Admin</SelectItem>
									<SelectItem value="hr_manager">HR Manager</SelectItem>
									<SelectItem value="payroll_manager">
										Payroll Manager
									</SelectItem>
									<SelectItem value="manager">Manager</SelectItem>
									<SelectItem value="member">Member</SelectItem>
								</SelectContent>
							</Select>
							<p className="text-muted-foreground text-xs">
								Roles determine what actions a user can perform within the
								organization.
							</p>
						</div>
					</div>
					<DialogFooter>
						<Button onClick={() => setIsEditOpen(false)} variant="outline">
							Cancel
						</Button>
						<Button disabled={updateMutation.isPending} onClick={saveRole}>
							{updateMutation.isPending ? "Saving..." : "Save Changes"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<Dialog onOpenChange={setIsRemoveOpen} open={isRemoveOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Remove Member</DialogTitle>
					</DialogHeader>
					<p className="text-muted-foreground text-sm">
						Are you sure you want to remove this member from the organization?
						This action cannot be undone.
					</p>
					<DialogFooter>
						<Button onClick={() => setIsRemoveOpen(false)} variant="outline">
							Cancel
						</Button>
						<Button
							disabled={removeMutation.isPending}
							onClick={confirmRemoveMember}
							variant="destructive"
						>
							{removeMutation.isPending ? "Removing..." : "Remove Member"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<div className="rounded-md border">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Member</TableHead>
							<TableHead>Role</TableHead>
							<TableHead>Joined</TableHead>
							<TableHead>Status</TableHead>
							<TableHead className="text-right">Actions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>{renderTableContent()}</TableBody>
				</Table>
			</div>
		</div>
	);
}
