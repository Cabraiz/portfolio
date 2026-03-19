import { Link } from "react-router-dom";
import AncientPaper from "../../components/AncientPaper";

const Rosa: React.FC = () => {
	return (
		<AncientPaper>
			<h1>🌹 Etapa ROSA</h1>
			<p>
				Mesmo que tudo pareça um pouco pesado agora...
				<br />
				estamos aqui, firmes, cuidando um do outro com paciência e amor.
				<br />
				<br />
				A etapa Rosa simboliza esse pacto silencioso de continuar —<br />
				de acreditar que até DEZEMBRO tudo vai estar mais leve, mais nosso, mais
				em paz.
				<br />
				<br />
				Já conseguimos tanto, e ainda vamos sorrir juntos pensando nas férias de
				2026.
				<br />
				Tá tudo bem, tá tudo tranquilo. 🌷
			</p>

			<Link to="/vinho-unlock">
				<button className="btn-continue" style={{ marginTop: "2rem" }}>
					Ir para etapa final (ワイン)
				</button>
			</Link>
		</AncientPaper>
	);
};

export default Rosa;
