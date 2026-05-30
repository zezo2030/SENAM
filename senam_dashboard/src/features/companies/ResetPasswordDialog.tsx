import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Loader2, Eye, EyeOff, Copy, Check } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  useResetCompanyPassword,
  type AdminCompany,
  type AdminCompanyDetail,
} from '@/api/admin-companies.api';

const MIN_LEN = 8;
const MAX_LEN = 128;

interface Props {
  company: (AdminCompany & Pick<AdminCompanyDetail, 'owners'>) | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function generatePassword(length = 12): string {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghijkmnpqrstuvwxyz';
  const digits = '23456789';
  const symbols = '!@#$%*?';
  const all = upper + lower + digits + symbols;
  const arr = new Uint32Array(length);
  crypto.getRandomValues(arr);
  let out = '';
  out += upper[arr[0]! % upper.length];
  out += lower[arr[1]! % lower.length];
  out += digits[arr[2]! % digits.length];
  out += symbols[arr[3]! % symbols.length];
  for (let i = 4; i < length; i++) {
    out += all[arr[i]! % all.length];
  }
  return out
    .split('')
    .sort(() => 0.5 - Math.random())
    .join('');
}

export function ResetPasswordDialog({ company, open, onOpenChange }: Props) {
  const reset = useResetCompanyPassword();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (open) {
      setPassword('');
      setShowPassword(false);
      setCopied(false);
    }
  }, [open]);

  if (!company) return null;

  const owners = company.owners ?? [];
  const ownerOwners = owners.filter((o) => o.role === 'owner');
  const valid =
    password.length >= MIN_LEN && password.length <= MAX_LEN;

  const onSave = async () => {
    if (!valid) return;
    try {
      const res = await reset.mutateAsync({ id: company.id, newPassword: password });
      toast.success(
        `تم تحديث كلمة المرور لـ ${res.updatedCount} مالك${res.updatedCount > 1 ? 'ين' : ''}.`,
      );
      onOpenChange(false);
    } catch (e) {
      toast.error('تعذر تحديث كلمة المرور.');
      console.error(e);
    }
  };

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error('تعذر نسخ كلمة المرور.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>تعيين كلمة مرور جديدة</DialogTitle>
          <DialogDescription>
            {company.displayName ?? company.legalName ?? company.id}
            <br />
            تعيين كلمة المرور لمالك(ي) لوحة تحكم الشركة. سيتم استخدام كلمة المرور
            الجديدة في تسجيل الدخول مباشرة.
          </DialogDescription>
        </DialogHeader>

        {ownerOwners.length > 0 ? (
          <div className="space-y-1 rounded-lg border bg-muted/30 p-3 text-sm">
            <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              سيتم تطبيق التغيير على:
            </div>
            <ul className="space-y-1">
              {ownerOwners.map((o) => (
                <li key={o.id} className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs">{o.email}</span>
                  {o.displayName ? (
                    <span className="text-xs text-muted-foreground">
                      {o.displayName}
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
            لا يوجد مالك مسجّل لهذه الشركة.
          </div>
        )}

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="new-password">كلمة المرور الجديدة</Label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => {
                setPassword(generatePassword(12));
                setShowPassword(true);
              }}
            >
              توليد عشوائي
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Input
                id="new-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                minLength={MIN_LEN}
                maxLength={MAX_LEN}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                autoFocus
              />
              <button
                type="button"
                aria-label={showPassword ? 'إخفاء' : 'إظهار'}
                onClick={() => setShowPassword((v) => !v)}
                className="absolute end-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => void onCopy()}
              disabled={!password}
              aria-label="نسخ"
            >
              {copied ? (
                <Check className="h-4 w-4 text-emerald-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            بين {MIN_LEN} و {MAX_LEN} حرف. تأكد من حفظ كلمة المرور أو نسخها قبل
            الإغلاق — لن تظهر مرة أخرى.
          </p>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={reset.isPending}
          >
            إلغاء
          </Button>
          <Button
            onClick={() => void onSave()}
            disabled={!valid || ownerOwners.length === 0 || reset.isPending}
          >
            {reset.isPending ? (
              <Loader2 className="me-2 h-4 w-4 animate-spin" />
            ) : null}
            تعيين كلمة المرور
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
