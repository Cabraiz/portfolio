import React, { useRef, useState } from "react";
import { Col, Row, Form, Button } from "react-bootstrap";
import { isMobile } from "react-device-detect";
import ScratchCard from "react-scratchcard-v2";

import icognita from "../../images/Surprise/Icognita.png";

const vh = 85;
const vw = 40;
const percRasp = 90;
function Surprise() {
  const [allColor, setColor] = useState(["20", "20", "20", "20", "20"]);
  const [finalizados, setFinalizado] = useState([
    false,
    false,
    false,
    false,
    false,
    false,
    false,
  ]);

  const ref = useRef<ScratchCard>(null);

  const onClickReset = () => {
    ref.current && ref.current.reset();
  };

  const convertVhToPx = (vh: number) => {
    const oneVhInPx = window.innerHeight / 100;
    return oneVhInPx * vh;
  };

  const convertVwToPx = (vw: number, a: number) => {
    const oneVhInPx = window.innerWidth / 100;
    let temp = oneVhInPx * vw;
    if (temp < 140) {
      temp = 140;
    }
    if (!isMobile) {
      temp = temp / 2.8;
    }
    if (finalizados[a]) {
      temp = 0;
    }
    return temp;
  };

  function mudarCorEnter(a: number) {
    allColor[a] = "40";
    console.log(allColor);
  }
  function mudarCorLeave(a: number) {
    allColor[a] = "20";
    console.log(allColor);
  }
  return (
    <Row className="m-0 p-0">
      <Col
        className="p-0 ms-0 me-0 mb-0 text-nowrap"
        style={{ marginTop: "5vh" }}
      >
        <div className="inline" style={{ marginRight: "-1.2vw" }}>
          <ScratchCard
            width={convertVwToPx(vw, 0)}
            height={convertVhToPx(vh)}
            image={icognita}
            finishPercent={percRasp}
            onComplete={() => console.log("complete")}
          >
            <Button
              style={{
                height: "100%",
                width: "95%",
              }}
            >
              ?
            </Button>
          </ScratchCard>
        </div>

        <div className="inline" style={{ marginRight: "-1.2vw" }}>
          <ScratchCard
            width={convertVwToPx(vw, 1)}
            height={convertVhToPx(vh)}
            image={icognita}
            finishPercent={percRasp}
            onComplete={() => console.log("complete")}
          >
            <Button
              style={{
                height: "100%",
                width: "95%",
              }}
            >
              ?
            </Button>
          </ScratchCard>
        </div>

        <div className="inline" style={{ marginRight: "-1.2vw" }}>
          <ScratchCard
            width={convertVwToPx(vw, 2)}
            height={convertVhToPx(vh)}
            image={icognita}
            finishPercent={percRasp}
            onComplete={() => console.log("complete")}
          >
            <Button
              style={{
                height: "100%",
                width: "95%",
              }}
            >
              ?
            </Button>
          </ScratchCard>
        </div>

        <div className="inline" style={{ marginRight: "-1.2vw" }}>
          <ScratchCard
            width={convertVwToPx(vw, 3)}
            height={convertVhToPx(vh)}
            image={icognita}
            finishPercent={percRasp}
            onComplete={() => console.log("complete")}
          >
            <Button
              style={{
                height: "100%",
                width: "95%",
              }}
            >
              ?
            </Button>
          </ScratchCard>
        </div>

        <div className="inline" style={{ marginRight: "-1.2vw" }}>
          <ScratchCard
            width={convertVwToPx(vw, 4)}
            height={convertVhToPx(vh)}
            image={icognita}
            finishPercent={percRasp}
            onComplete={() => console.log("complete")}
          >
            <Button
              style={{
                height: "100%",
                width: "95%",
              }}
            >
              ?
            </Button>
          </ScratchCard>
        </div>

        <div className="inline" style={{ marginRight: "-1.2vw" }}>
          <ScratchCard
            width={convertVwToPx(vw, 5)}
            height={convertVhToPx(vh)}
            image={icognita}
            finishPercent={percRasp}
            onComplete={() => console.log("complete")}
          >
            <Button
              style={{
                height: "100%",
                width: "95%",
              }}
            >
              ?
            </Button>
          </ScratchCard>
        </div>

        <div className="inline" style={{ marginRight: "-1.2vw" }}>
          <ScratchCard
            width={convertVwToPx(vw, 6)}
            height={convertVhToPx(vh)}
            image={icognita}
            finishPercent={percRasp}
            onComplete={() => console.log("complete")}
          >
            <Button
              style={{
                height: "100%",
                width: "95%",
              }}
            >
              ?
            </Button>
          </ScratchCard>
        </div>
      </Col>
    </Row>
  );
}

export default Surprise;
