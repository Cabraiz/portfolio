import React, { useRef, useState } from "react";
import { Col, Row, Form, Button } from "react-bootstrap";
import ScratchCard from "react-scratchcard-v2";

import icognita from "../../images/Surprise/Icognita.png";

function Surprise() {
  const [allColor, setColor] = useState(["20", "20", "20", "20", "20"]);

  const ref = useRef<ScratchCard>(null);

  const onClickReset = () => {
    ref.current && ref.current.reset();
  };
  const vh = 18;
  const convertVhToPx = (vh: number) => {
    const oneVhInPx = window.innerHeight / 100;
    return oneVhInPx * vh;
  };
  const vw = 85;
  const convertVwToPx = (vw: number) => {
    const oneVhInPx = window.innerWidth / 100;
    let temp = oneVhInPx * vw;
    if (temp < 140) {
      temp = 140;
    }
    console.log(temp);
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
      <Col className="p-0 text-nowrap" style={{ marginTop: "5vh" }}>
        <div className="inline">
          <ScratchCard
            width={convertVwToPx(vh)}
            height={convertVhToPx(vw)}
            image={icognita}
            finishPercent={80}
            onComplete={() => console.log("complete")}
          >
            <Button
              onMouseOver={() => mudarCorEnter(0)}
              onMouseOut={() => mudarCorLeave(0)}
            >
              ?
            </Button>
          </ScratchCard>
        </div>

        <div className="inline">
          <ScratchCard
            width={convertVwToPx(vh)}
            height={convertVhToPx(vw)}
            image={icognita}
            finishPercent={80}
            onComplete={() => console.log("complete")}
          >
            <div
              style={{
                backgroundColor: `rgb(${allColor[0]}, ${allColor[0]} , ${allColor[0]})`,
              }}
            >
              <Button
                onMouseOver={() => mudarCorEnter(0)}
                onMouseOut={() => mudarCorLeave(0)}
              >
                ?
              </Button>
            </div>
          </ScratchCard>
        </div>

        <div className="inline">
          <ScratchCard
            width={convertVwToPx(vh)}
            height={convertVhToPx(vw)}
            image={icognita}
            finishPercent={80}
            onComplete={() => console.log("complete")}
          >
            <div
              style={{
                backgroundColor: `rgb(${allColor[0]}, ${allColor[0]} , ${allColor[0]})`,
              }}
            >
              <Button
                onMouseOver={() => mudarCorEnter(0)}
                onMouseOut={() => mudarCorLeave(0)}
              >
                ?
              </Button>
            </div>
          </ScratchCard>
        </div>

        <div className="inline">
          <ScratchCard
            width={convertVwToPx(vh)}
            height={convertVhToPx(vw)}
            image={icognita}
            finishPercent={80}
            onComplete={() => console.log("complete")}
          >
            <div
              style={{
                backgroundColor: `rgb(${allColor[0]}, ${allColor[0]} , ${allColor[0]})`,
              }}
            >
              <Button
                onMouseOver={() => mudarCorEnter(0)}
                onMouseOut={() => mudarCorLeave(0)}
              >
                ?
              </Button>
            </div>
          </ScratchCard>
        </div>

        <div className="inline">
          <ScratchCard
            width={convertVwToPx(vh)}
            height={convertVhToPx(vw)}
            image={icognita}
            finishPercent={80}
            onComplete={() => console.log("complete")}
          >
            <div
              style={{
                backgroundColor: `rgb(${allColor[0]}, ${allColor[0]} , ${allColor[0]})`,
              }}
            >
              <Button
                onMouseOver={() => mudarCorEnter(0)}
                onMouseOut={() => mudarCorLeave(0)}
              >
                ?
              </Button>
            </div>
          </ScratchCard>
        </div>

        <div className="inline">
          <ScratchCard
            width={convertVwToPx(vh)}
            height={convertVhToPx(vw)}
            image={icognita}
            finishPercent={80}
            onComplete={() => console.log("complete")}
          >
            <div
              style={{
                backgroundColor: `rgb(${allColor[0]}, ${allColor[0]} , ${allColor[0]})`,
              }}
            >
              <Button
                onMouseOver={() => mudarCorEnter(0)}
                onMouseOut={() => mudarCorLeave(0)}
              >
                ?
              </Button>
            </div>
          </ScratchCard>
        </div>

        <div className="inline">
          <ScratchCard
            width={convertVwToPx(vh)}
            height={convertVhToPx(vw)}
            image={icognita}
            finishPercent={80}
            onComplete={() => console.log("complete")}
          >
            <div
              style={{
                backgroundColor: `rgb(${allColor[0]}, ${allColor[0]} , ${allColor[0]})`,
              }}
            >
              <Button
                onMouseOver={() => mudarCorEnter(0)}
                onMouseOut={() => mudarCorLeave(0)}
              >
                ?
              </Button>
            </div>
          </ScratchCard>
        </div>
      </Col>
    </Row>
  );
}

export default Surprise;
