export interface OtpInputProps {
  length?: number;
  onComplete: (otp: string) => void;
}
