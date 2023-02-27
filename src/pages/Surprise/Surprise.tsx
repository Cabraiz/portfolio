import React, { useEffect, useRef, useState } from "react";
import AudioPlayer from "react-h5-audio-player";
import "react-h5-audio-player/lib/styles.css";
import { Col, Row, Image, Button, Modal } from "react-bootstrap";
import update from "react-addons-update";
import { isMobile } from "react-device-detect";
import ScratchCard from "react-scratchcard-v2";

import icognita from "../../images/Surprise/Icognita.png";
import icognitaBlock from "../../images/Surprise/IcognitaBlock.png";
import circle from "../../images/Surprise/circle.png";

import { auth, db } from "../../Firebase/Firebase";
import { getDoc, setDoc, doc } from "firebase/firestore";

const backgroundSong = require("../../song/Surprise/backgroundSong.ogg");

const vh = 85;
const vw = 46;
const percRasp = 99;

function Surprise() {
  const [data, setData] = useState(25);
  const startHorarios = [15, 16, 18, 18, 20, 23];

  const person = {
    finalizados: false,
    horarios: 0,
  };

  const [finalizados, setFinalizado] = useState(
    Array(5).fill(Object.create(person))
  );

  const [bloqueados, setBloqueado] = useState(
    Array(5).fill(Object.create(person))
  );

  useEffect(() => {
    const getRealTime = async () => {
      const response = await fetch(
        "http://worldtimeapi.org/api/timezone/America/Fortaleza"
      );
      const temp = await response.json();
      setData(+new Date(temp.datetime));
    };

    getRealTime();
  }, []);

  function getStringValue(value: any): string {
    return String(value);
  }

  const setTodo = async () => {
    const temp = getStringValue(auth.currentUser?.uid);
    if (temp !== undefined) {
      await setDoc(doc(db, temp, "bloqueados"), {
        0: false,
        1: false,
        2: false,
        3: false,
        4: false,
        5: false,
      });
    }
  };

  const fetchPost = async () => {
    const docRef = doc(db, "cities", "SF");
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      console.log("Document data:", docSnap.data());
    } else {
      // doc.data() will be undefined in this case
      console.log("No such document!");
    }
  };

  const ref = useRef<ScratchCard>(null);

  const icognitaStatus = (b: number) => {
    if (startHorarios[b] < data) {
      return icognita;
    }
    return icognitaBlock;
  };

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

  const stringCustomStyle = {
    borderStyle: "solid",
    borderColor: "white",
    borderWidth: "5px 5px 5px 0",
    borderRadius: "5px",
  };
  const cardCustomStyle = {
    image: circle,
    width: 15,
    height: 15,
  };

  return (
    <>
      <Row className="m-0 p-0">
        <Col
          className="p-0 ms-0 me-0 mb-0 text-nowrap"
          style={{ marginTop: "5vh" }}
        >
          <div className="inline" style={stringCustomStyle}>
            <ScratchCard
              width={convertVwToPx(vw, 0)}
              height={convertVhToPx(vh)}
              image={icognitaStatus(0)}
              finishPercent={percRasp}
              onComplete={() => handleStatus(0, true)}
              customBrush={cardCustomStyle}
            >
              <Image className="porBaixo"></Image>
            </ScratchCard>
          </div>

          <div className="inline" style={stringCustomStyle}>
            <ScratchCard
              width={convertVwToPx(vw, 1)}
              height={convertVhToPx(vh)}
              image={icognitaStatus(1)}
              finishPercent={percRasp}
              onComplete={() => handleStatus(1, true)}
            >
              <Button className="btnImage porBaixo">?</Button>
            </ScratchCard>
          </div>

          <div className="inline" style={stringCustomStyle}>
            <ScratchCard
              width={convertVwToPx(vw, 2)}
              height={convertVhToPx(vh)}
              image={icognitaStatus(2)}
              finishPercent={percRasp}
              onComplete={() => console.log("complete")}
            >
              <Image className="porBaixo"></Image>
            </ScratchCard>
          </div>

          <div className="inline" style={stringCustomStyle}>
            <ScratchCard
              width={convertVwToPx(vw, 3)}
              height={convertVhToPx(vh)}
              image={icognitaStatus(3)}
              finishPercent={percRasp}
              onComplete={() => console.log("complete")}
            >
              <Button className="btnImage porBaixo">?</Button>
            </ScratchCard>
          </div>

          <div className="inline" style={stringCustomStyle}>
            <ScratchCard
              width={convertVwToPx(vw, 4)}
              height={convertVhToPx(vh)}
              image={icognitaStatus(4)}
              finishPercent={percRasp}
              onComplete={() => console.log("complete")}
            >
              <Button className="btnImage porBaixo">?</Button>
            </ScratchCard>
          </div>

          <div className="inline" style={stringCustomStyle}>
            <ScratchCard
              width={convertVwToPx(vw, 5)}
              height={convertVhToPx(vh)}
              image={icognitaStatus(5)}
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
        <Modal.Header closeButton>
          Aperte&nbsp;<strong>(▷)</strong>&nbsp;Para Ver Seu Prêmio
        </Modal.Header>
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
