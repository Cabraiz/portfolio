import { Stage } from "./components/Stage";
import { Backdrop } from "./components/Backdrop";
import { List } from "./components/List";

const Principal = () => {
  return (
    <>
      <Stage
        imageUrl="https://lojausereserva.vtexassets.com/arquivos/ids/7956078-1200-auto?v=638248721303730000&width=1200&height=auto&aspect=true"
        currentPrice="R$ 269,99"
      />
      <Backdrop>
        <List>
          <button>
            <img
              style={{
                width: 100,
                height: 100,
                objectFit: "cover",
                margin: "0 10px",
              }}
              src="https://lojausereserva.vtexassets.com/arquivos/ids/7956077-1200-auto?v=638248721291830000&width=1200&height=auto&aspect=true"
              alt=""
            />
          </button>
        </List>
      </Backdrop>
    </>
  );
};

export default Principal;