export interface RegisterParams {
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error: boolean | undefined;
  helperText: string;
  type?: string;
  name?: string;
  id?: string;
  placeholder?: string;
}

export interface ModeloLadoEsquerdoPageParams {
  realHeight: string;
  isAnimationSet: boolean;
  Login_Image: string;
  Login_Logo: string;
  JSX: JSX.Element;
}
