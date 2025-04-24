import { Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface InviteCompleteStatusProps {
  inviteCount?: number;
  compact?: boolean;
  showTitle?: boolean;
}

export default function InviteCompleteStatus({ 
  inviteCount = 0, 
  compact = false,
  showTitle = true
}: InviteCompleteStatusProps) {
  return (
    <Card className={`${compact ? "p-3" : "p-4"} border-2 ${inviteCount > 0 ? "border-emerald-300" : "border-gray-200"}`}>
      <CardContent className="p-0 flex items-center justify-between">
        <div>
          {showTitle && (
            <h3 className={`${compact ? "text-sm" : "text-base"} font-medium`}>
              Invite Status
            </h3>
          )}
          <div className="flex items-center mt-1">
            <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium whitespace-nowrap">
              INVITE COMPLETE
            </span>
            {inviteCount > 0 && (
              <span className="ml-2 text-sm text-gray-600">
                {inviteCount} {inviteCount === 1 ? 'invitation' : 'invitations'}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center justify-center rounded-full bg-emerald-50 p-2">
          <Sparkles className="h-5 w-5 text-emerald-500" />
        </div>
      </CardContent>
    </Card>
  );
}