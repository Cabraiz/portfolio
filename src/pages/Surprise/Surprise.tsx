import React, { useRef, useState } from "react";
import AudioPlayer from "react-h5-audio-player";
import "react-h5-audio-player/lib/styles.css";
import { Col, Row, Image, Button, Modal } from "react-bootstrap";
import update from "react-addons-update";
import { isMobile } from "react-device-detect";
import ScratchCard from "react-scratchcard-v2";

import icognita from "../../images/Surprise/Icognita.png";
import icognitaBlock from "../../images/Surprise/IcognitaBlock.png";

const backgroundSong = require("../../song/Surprise/backgroundSong.ogg");

const vh = 85;
const vw = 46;
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

  const [bloqueados, setBloqueado] = useState([
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
    if (!isMobile) {
      temp = temp / 3.3;
    }
    if (temp < 140) {
      temp = 140;
    }
    return temp;
  };

  //MODAL
  const [show, setShow] = useState([false, false]);

  const handleStatus = (a: number, b: boolean) => {
    setShow(
      update(show, {
        [a]: {
          $set: b,
        },
      })
    );
  };

  return (
    <>
      <Row className="m-0 p-0">
        <Col
          className="p-0 ms-0 me-0 mb-0 text-nowrap"
          style={{ marginTop: "5vh" }}
        >
          <div
            className="inline"
            style={{ pointerEvents: "none", marginRight: "-0.2vw" }}
          >
            <ScratchCard
              width={convertVwToPx(vw, 0)}
              height={convertVhToPx(vh)}
              image={icognitaBlock}
              finishPercent={percRasp}
              onComplete={() => handleStatus(0, true)}
            >
              <Image className="porBaixo"></Image>
            </ScratchCard>
          </div>

          <div className="inline" style={{ marginRight: "-0.2vw" }}>
            <ScratchCard
              width={convertVwToPx(vw, 1)}
              height={convertVhToPx(vh)}
              image={icognita}
              finishPercent={percRasp}
              onComplete={() => handleStatus(1, true)}
            >
              <Button className="btnImage porBaixo">?</Button>
            </ScratchCard>
          </div>

          <div className="inline" style={{ marginRight: "-0.2vw" }}>
            <ScratchCard
              width={convertVwToPx(vw, 2)}
              height={convertVhToPx(vh)}
              image={icognita}
              finishPercent={percRasp}
              onComplete={() => console.log("complete")}
            >
              <Image className="porBaixo"></Image>
            </ScratchCard>
          </div>

          <div className="inline" style={{ marginRight: "-0.2vw" }}>
            <ScratchCard
              width={convertVwToPx(vw, 3)}
              height={convertVhToPx(vh)}
              image={icognita}
              finishPercent={percRasp}
              onComplete={() => console.log("complete")}
            >
              <Button className="btnImage porBaixo">?</Button>
            </ScratchCard>
          </div>

          <div className="inline" style={{ marginRight: "-0.2vw" }}>
            <ScratchCard
              width={convertVwToPx(vw, 4)}
              height={convertVhToPx(vh)}
              image={icognita}
              finishPercent={percRasp}
              onComplete={() => console.log("complete")}
            >
              <Button className="btnImage porBaixo">?</Button>
            </ScratchCard>
          </div>

          <div className="inline" style={{ marginRight: "-0.2vw" }}>
            <ScratchCard
              width={convertVwToPx(vw, 5)}
              height={convertVhToPx(vh)}
              image={icognita}
              finishPercent={percRasp}
              onComplete={() => console.log("complete")}
            >
              <Button className="btnImage porBaixo">?</Button>
            </ScratchCard>
          </div>

          <div className="inline" style={{ marginRight: "-0.2vw" }}>
            <ScratchCard
              width={convertVwToPx(vw, 6)}
              height={convertVhToPx(vh)}
              image={icognita}
              finishPercent={percRasp}
              onComplete={() => console.log("complete")}
            >
              <Button className="btnImage porBaixo">?</Button>
            </ScratchCard>
          </div>
        </Col>
      </Row>
      <Modal show={show[0]} onHide={() => handleStatus(0, false)}>
        <Modal.Header closeButton>
          <Modal.Title>Modal heading</Modal.Title>
        </Modal.Header>
        <Modal.Body>Woohoo, you're reading this text in a modal!</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => handleStatus(0, false)}>
            Close
          </Button>
          <Button variant="primary" onClick={() => handleStatus(0, false)}>
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>
      <Modal show={show[1]} onHide={() => handleStatus(1, false)}>
        <Modal.Header closeButton>Foto</Modal.Header>
        <Modal.Body>
          <AudioPlayer
            autoPlay
            src={backgroundSong}
            onPlay={(e) => console.log("onPlay")}
            loop={true}
          />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => handleStatus(0, false)}>
            Close
          </Button>
          <Button variant="primary" onClick={() => handleStatus(0, false)}>
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}

export default Surprise;
