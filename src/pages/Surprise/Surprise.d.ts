declare module "react-confetti" {
  export interface ConfettiProps {
    width: number;
    height: number;
    // Outras propriedades, se houver
  }

  const Confetti: React.FC<ConfettiProps>;
  export default Confetti;
}
