import React, { useState } from "react";
import { Col, Row, Form, Button } from "react-bootstrap";

import icognita from "../../images/Surprise/Icognita.png";

function Surprise() {
  const [allColor, setColor] = useState(["20", "20", "20", "20", "20"]);
  function mudarCorEnter(a: number) {
    allColor[a] = "40";
    console.log(allColor);
  }
  function mudarCorLeave(a: number) {
    allColor[a] = "20";
    console.log(allColor);
  }
  return (
    <Row className="m-0 p-0 ">
      <Col className="p-0 text-nowrap" style={{ marginTop: "5vh" }}>
        <Button
          onMouseOver={() => mudarCorEnter(0)}
          onMouseOut={() => mudarCorLeave(0)}
          style={{
            backgroundColor: `rgb(${allColor[0]}, ${allColor[0]} , ${allColor[0]})`,
          }}
        >
          ?
        </Button>

        <Button
          style={{
            backgroundColor: `rgb(${allColor[1]}, ${allColor[1]} , ${allColor[1]})`,
          }}
        >
          ?
        </Button>

        <Button
          style={{
            backgroundColor: `rgb(${allColor[2]}, ${allColor[2]} , ${allColor[2]})`,
          }}
        >
          ?
        </Button>

        <Button
          style={{
            backgroundColor: `rgb(${allColor[3]}, ${allColor[3]} , ${allColor[3]})`,
          }}
        >
          ?
        </Button>

        <Button
          style={{
            backgroundColor: `rgb(${allColor[4]}, ${allColor[4]} , ${allColor[4]})`,
          }}
        >
          ?
        </Button>
      </Col>
    </Row>
  );
}

export default Surprise;
