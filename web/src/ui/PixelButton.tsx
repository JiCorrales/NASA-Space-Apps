import type { ButtonHTMLAttributes } from "react";

export function PixelButton({ primary, className = "", ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { primary?: boolean }) {
  return <button type="button" className={`pxbtn ${primary ? "pxbtn--primary" : ""} ${className}`} {...rest} />;
}
