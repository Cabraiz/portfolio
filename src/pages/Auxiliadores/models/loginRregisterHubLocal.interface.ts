export interface LoginRegisterHubLocalParams {
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