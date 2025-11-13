import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Users, User, AlertCircle } from "lucide-react";

interface CreatePaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feeStructure: any;
  students: any[];
  onSubmit: (data: {
    type: 'all' | 'single';
    studentId?: string;
    period: string;
    dueDate: string;
  }) => void;
  isLoading?: boolean;
}

export function CreatePaymentDialog({
  open,
  onOpenChange,
  feeStructure,
  students,
  onSubmit,
  isLoading = false,
}: CreatePaymentDialogProps) {
  const [step, setStep] = useState<'confirm' | 'details'>('confirm');
  const [paymentType, setPaymentType] = useState<'all' | 'single'>('all');
  const [selectedStudent, setSelectedStudent] = useState('');
  const [formData, setFormData] = useState({
    period: '',
    dueDate: '',
  });

  const handleConfirm = () => {
    setStep('details');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      type: paymentType,
      studentId: paymentType === 'single' ? selectedStudent : undefined,
      ...formData,
    });
  };

  const handleClose = () => {
    setStep('confirm');
    setPaymentType('all');
    setSelectedStudent('');
    setFormData({ period: '', dueDate: '' });
    onOpenChange(false);
  };

  if (!feeStructure) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {step === 'confirm' ? 'Create Payment Records' : 'Payment Details'}
          </DialogTitle>
        </DialogHeader>

        {step === 'confirm' ? (
          <div className="space-y-4">
            <div className="p-4 bg-muted/50 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Class:</span>
                <span className="font-medium">{feeStructure.class}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Session:</span>
                <span className="font-medium">{feeStructure.session}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Amount:</span>
                <span className="font-bold text-primary">₹{feeStructure.totalFee?.toLocaleString()}</span>
              </div>
            </div>

            <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium">Are you sure?</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    This will create pending payment records. Students will be able to see and pay these fees.
                  </p>
                </div>
              </div>
            </div>

            <RadioGroup value={paymentType} onValueChange={(value: any) => setPaymentType(value)}>
              <div className="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-accent/50">
                <RadioGroupItem value="all" id="all" />
                <Label htmlFor="all" className="flex items-center gap-2 cursor-pointer flex-1">
                  <Users className="w-4 h-4" />
                  <div>
                    <p className="font-medium">All Students</p>
                    <p className="text-xs text-muted-foreground">
                      Create payment for all {students.length} students in the class
                    </p>
                  </div>
                </Label>
              </div>

              <div className="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-accent/50">
                <RadioGroupItem value="single" id="single" />
                <Label htmlFor="single" className="flex items-center gap-2 cursor-pointer flex-1">
                  <User className="w-4 h-4" />
                  <div>
                    <p className="font-medium">Specific Student</p>
                    <p className="text-xs text-muted-foreground">
                      Create payment for one student only
                    </p>
                  </div>
                </Label>
              </div>
            </RadioGroup>

            {paymentType === 'single' && (
              <div className="space-y-2">
                <Label>Select Student *</Label>
                {students.length === 0 ? (
                  <div className="p-3 border rounded-lg bg-muted/50 text-sm text-muted-foreground">
                    <AlertCircle className="w-4 h-4 inline mr-2" />
                    No students found in this class. Please add students first.
                  </div>
                ) : (
                  <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a student" />
                    </SelectTrigger>
                    <SelectContent>
                      {students.map((student) => (
                        <SelectItem key={student._id} value={student._id}>
                          {student.firstName} {student.lastName} ({student.studentId})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={paymentType === 'single' && (!selectedStudent || students.length === 0)}
              >
                Continue
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="period">Payment Period *</Label>
              <Input
                id="period"
                value={formData.period}
                onChange={(e) => setFormData({ ...formData, period: e.target.value })}
                placeholder="e.g., January 2024, Q1 2024, Term 1"
                required
              />
              <p className="text-xs text-muted-foreground">
                This will identify the payment period for students
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date *</Label>
              <Input
                id="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                required
              />
            </div>

            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm font-medium mb-2">Summary:</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Type: {paymentType === 'all' ? `All ${students.length} students` : '1 student'}</li>
                <li>• Amount: ₹{feeStructure.totalFee?.toLocaleString()} per student</li>
                <li>• Period: {formData.period || 'Not set'}</li>
                <li>• Due: {formData.dueDate || 'Not set'}</li>
              </ul>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setStep('confirm')}>
                Back
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Payment Records"
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
