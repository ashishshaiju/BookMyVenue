import { Badge } from "../../ui/badge";
import { Card } from "../../ui/card";
import {
  User,
  Calendar,
  Shield,
  Activity,
  Phone,
  Mail,
  Ban,
} from "lucide-react";

interface BanRecord {
  _id: string;
  scope: "full" | "commenting" | "owner_dashboard" | "venue_creation";
  reason: string;
  status: "active" | "lifted" | "expired";
  bannedAt: string | Date;
  expiresAt?: string | Date | null;
  liftedAt?: string | Date | null;
  bannedBy?: { username: string; email: string };
  liftedBy?: { username: string; email: string };
}

interface UserData {
  name?: string;
  username?: string;
  email?: string;
  phone?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  status?: string;
  active?: boolean;
  _id?: string;
  role?: string;
  venues?: Record<string, unknown>[];
  deleted?: boolean;
  roles?: string[];
  passwordChangedAt?: string | Date;
  isBanned?: boolean;
  bans?: BanRecord[];
  [key: string]: unknown;
}
export function UserDetailPanel({
  data: rawData,
}: {
  data: Record<string, unknown>;
}) {
  const data = rawData as unknown as UserData;
  if (!data) return null;

  const roles = data.roles;

  return (
    <div className="space-y-6 text-sm">
      {/* Header Profile Section */}
      <div className="flex flex-col md:flex-row items-start md:items-center gap-6 p-6 rounded-xl bg-background/50 border border-border">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary/20 shrink-0">
          <User className="w-10 h-10 text-primary" />
        </div>
        <div className="flex-1 space-y-1">
          <h2 className="text-2xl font-bold text-foreground">
            {data.username || data.name}
          </h2>
          <div className="flex items-center gap-3 text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1">
              <Mail className="w-4 h-4" /> {data.email}
            </span>
            {data.phone && (
              <span className="flex items-center gap-1">
                <Phone className="w-4 h-4" /> {data.phone}
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          <Badge
            variant={data.active ? "default" : "destructive"}
            className="text-sm px-3 py-1"
          >
            {data.active ? "Active Account" : "Inactive Account"}
          </Badge>
          {data.isBanned && (
            <Badge
              variant="destructive"
              className="bg-red-600/20 text-red-600 hover:bg-red-600/30 flex items-center gap-1"
            >
              <Ban className="w-3 h-3" /> Banned
            </Badge>
          )}
          {data.deleted && (
            <Badge
              variant="destructive"
              className="bg-red-500/20 text-red-500 hover:bg-red-500/30"
            >
              Deleted
            </Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Account Details */}
        <Card className="p-5 space-y-4 bg-background/50">
          <h3 className="font-semibold text-foreground flex items-center gap-2 border-b border-border pb-2">
            <Shield className="w-4 h-4 text-primary" /> Role & Permissions
          </h3>
          <div className="space-y-4">
            <div>
              <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-2">
                Assigned Roles
              </span>
              <div className="flex flex-wrap gap-2">
                {roles && roles.length > 0 ? (
                  roles.map((role: string, i: number) => (
                    <Badge
                      key={i}
                      variant="secondary"
                      className="capitalize px-3 py-1"
                    >
                      {role}
                    </Badge>
                  ))
                ) : (
                  <Badge variant="outline" className="capitalize px-3 py-1">
                    {data.role || "User"}
                  </Badge>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">
                  User ID
                </span>
                <span className="font-mono text-xs bg-accent/50 px-2 py-1 rounded select-all">
                  {data._id}
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Activity & Audit */}
        <Card className="p-5 space-y-4 bg-background/50">
          <h3 className="font-semibold text-foreground flex items-center gap-2 border-b border-border pb-2">
            <Activity className="w-4 h-4 text-primary" /> Account Activity
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 gap-y-6">
            <div>
              <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1 flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Member Since
              </span>
              <span className="font-medium text-foreground">
                {data.createdAt
                  ? new Date(data.createdAt).toLocaleString()
                  : "N/A"}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1 flex items-center gap-1">
                <Activity className="w-3 h-3" /> Last Updated
              </span>
              <span className="font-medium text-foreground">
                {data.updatedAt
                  ? new Date(data.updatedAt).toLocaleString()
                  : "N/A"}
              </span>
            </div>
            {data.passwordChangedAt && (
              <div className="sm:col-span-2">
                <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">
                  Last Password Change
                </span>
                <span className="text-foreground">
                  {new Date(data.passwordChangedAt).toLocaleString()}
                </span>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Ban Information */}
      {data.bans && data.bans.length > 0 && (
        <div className="space-y-3">
          {data.bans.map((ban) => (
            <Card
              key={ban._id}
              className="p-5 space-y-4 bg-red-500/5 border-red-200 dark:border-red-900"
            >
              <div className="flex items-start justify-between">
                <h3 className="font-semibold text-red-600 dark:text-red-400 flex items-center gap-2">
                  <Ban className="w-4 h-4" />{" "}
                  {ban.scope.replace(/_/g, " ").toUpperCase()}
                </h3>
                <Badge
                  variant={
                    ban.status === "active" ? "destructive" : "secondary"
                  }
                  className="capitalize"
                >
                  {ban.status}
                </Badge>
              </div>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-red-600/70 dark:text-red-400/70 block text-xs uppercase tracking-wider mb-1">
                    Reason
                  </span>
                  <span className="text-foreground font-medium">
                    {ban.reason}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-red-600/70 dark:text-red-400/70 block text-xs uppercase tracking-wider mb-1">
                      Banned On
                    </span>
                    <span className="text-foreground">
                      {new Date(ban.bannedAt).toLocaleString()}
                    </span>
                  </div>
                  {ban.expiresAt && (
                    <div>
                      <span className="text-red-600/70 dark:text-red-400/70 block text-xs uppercase tracking-wider mb-1">
                        Expires On
                      </span>
                      <span className="text-foreground">
                        {new Date(ban.expiresAt).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
                {ban.bannedBy && (
                  <div>
                    <span className="text-red-600/70 dark:text-red-400/70 block text-xs uppercase tracking-wider mb-1">
                      Banned By
                    </span>
                    <span className="text-foreground">
                      {ban.bannedBy.username} ({ban.bannedBy.email})
                    </span>
                  </div>
                )}
                {ban.liftedAt && ban.liftedBy && (
                  <div>
                    <span className="text-green-600/70 dark:text-green-400/70 block text-xs uppercase tracking-wider mb-1">
                      Lifted By
                    </span>
                    <span className="text-foreground">
                      {ban.liftedBy.username} on{" "}
                      {new Date(ban.liftedAt).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
