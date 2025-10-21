import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { AlertCircle } from "lucide-react";

interface AddLeadErrorDialogProps {
  open: boolean;
  onClose: () => void;
}

const AddLeadErrorDialog = ({ open, onClose }: AddLeadErrorDialogProps) => {
  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <AlertDialogTitle>Cannot Add Lead - Sheet Protected</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="space-y-3 pt-4">
            <p>
              The Google Sheet has protected cells or ranges that prevent adding new leads.
            </p>
            <div className="bg-muted p-3 rounded-lg space-y-2">
              <p className="font-semibold text-sm">To fix this issue:</p>
              <ol className="list-decimal ml-4 space-y-1 text-sm">
                <li>Open your Google Sheet</li>
                <li>Go to Data → Protected sheets and ranges</li>
                <li>Remove protection from the MASTER DATA sheet, OR</li>
                <li>Add editor permissions for the service account email</li>
              </ol>
            </div>
            <p className="text-sm text-muted-foreground">
              Contact your sheet administrator if you don't have permission to change these settings.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={onClose}>Got it</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default AddLeadErrorDialog;
