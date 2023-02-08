import React, { useState } from "react";
import { Col, Row, Form } from "react-bootstrap";

import icognita from "../../images/Surprise/Icognita.png";

function Surprise() {
  const [allColor, setColor] = useState(["20", "40", "60", "80", "100"]);
  return (
    <Row className="m-0 p-0 ">
      <Col className="p-0 text-nowrap" style={{ marginTop: "5vh" }}>
        <Form.Control
          //onMouseEnter={() => this.someHandler}
          value="?"
          style={{
            backgroundColor: `rgb(${allColor[0]}, ${allColor[0]} , ${allColor[0]})`,
          }}
        />

        <Form.Control
          value="?"
          style={{
            backgroundColor: `rgb(${allColor[1]}, ${allColor[1]} , ${allColor[1]})`,
          }}
        />

        <Form.Control
          value="?"
          style={{
            backgroundColor: `rgb(${allColor[2]}, ${allColor[2]} , ${allColor[2]})`,
          }}
        />

        <Form.Control
          value="?"
          style={{
            backgroundColor: `rgb(${allColor[3]}, ${allColor[3]} , ${allColor[3]})`,
          }}
        />

        <Form.Control
          value="?"
          style={{
            backgroundColor: `rgb(${allColor[4]}, ${allColor[4]} , ${allColor[4]})`,
          }}
        />
      </Col>
    </Row>
  );
}

export default Surprise;
