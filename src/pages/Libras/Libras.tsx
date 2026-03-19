import { Link } from "react-router-dom";
import AncientPaper from "../../components/AncientPaper";

const Libras: React.FC = () => {
	return (
		<AncientPaper>
			<h1>📜 Etapa LIBRAS</h1>
			<p>
				Que os registros eternizem este momento raro.
				<br />
				Àquela que cuida de mim com doçura, que é paciente mesmo quando tudo é
				confuso,
				<br />
				e que transforma pequenos gestos em abrigo seguro...
				<br />
				<br />
				Obrigado por ser fofinha do seu jeito único. 💖
				<br />O pacto da ternura está selado, e ele é todo seu.
			</p>

			<Link to="/rosa-unlock">
				<button className="btn-continue" style={{ marginTop: "2rem" }}>
					Ir para próxima etapa (Rosa)
				</button>
			</Link>
		</AncientPaper>
	);
};

export default Libras;
