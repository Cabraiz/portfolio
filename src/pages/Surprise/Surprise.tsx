import React, { useEffect, useState } from "react";
import Confetti from "react-confetti";
import { isMobile } from "react-device-detect";
import AudioPlayer from "react-h5-audio-player";
import "react-h5-audio-player/lib/styles.css";
import { Col, Row, Image, Modal } from "react-bootstrap";
import update from "react-addons-update";

import Done_1 from "../../images/Surprise/Done_1.png";
import Done_2 from "../../images/Surprise/Done_2.png";
import Done_3 from "../../images/Surprise/Done_3.png";
import Done_4 from "../../images/Surprise/Done_4.png";
import Done_5 from "../../images/Surprise/Done_5.png";
import Done_6 from "../../images/Surprise/Done_6.png";

import { auth, db } from "../../Firebase/Firebase";
import { getDoc, setDoc, doc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import "animate.css";

import { Done, Default, Block } from "./Triplice/Triplice";

const backgroundSong = require("../../song/Surprise/backgroundSong.ogg");

let load = false;

function Surprise() {
  const startHorarios = [15, 16, 18, 18, 20, 23];
  const [finalizados, setFinalizados] = useState<any>([]);
  let finalizadosBool: any[] = [];

  const [cssCombine] = useState<any>([]);

  const getRealTime = async () => {
    const response = await fetch(
      "https://worldtimeapi.org/api/timezone/America/Fortaleza"
    );
    const temp = await response.json();
    return new Date(temp.datetime).getHours();
  };

  const fetchPost = async () => {
    const temp = getStringValue(auth.currentUser?.uid);
    const docRef = doc(db, temp, "bloqueados");
    const docSnap = await getDoc(docRef);
    const hora = await getRealTime();
    if (docSnap.exists()) {
      let tempBooleanos = [];
      for (const element of Object.values(docSnap.data())) {
        tempBooleanos.push(element);
      }
      finalizadosBool = tempBooleanos;
      setFinalizados([
        returnFetchPost(0, tempBooleanos[0], hora),
        returnFetchPost(1, tempBooleanos[1], hora),
        returnFetchPost(2, tempBooleanos[2], hora),
        returnFetchPost(3, tempBooleanos[3], hora),
        returnFetchPost(4, tempBooleanos[4], hora),
        returnFetchPost(5, tempBooleanos[5], hora),
      ]);
      console.log("finalizados", finalizados);
    } else {
      // doc.data() will be undefined in this case
      console.log("No such document!");
    }
  };

  const imagensAcervo = [Done_1, Done_2, Done_3, Done_4, Done_5, Done_6];
  const returnFetchPost = (a: number, b: boolean, data: number) => {
    if (b) {
      cssCombine.push({});
      return (
        <Done onComplete={() => handleStatus(a, true)}>
          <Image className="porBaixo" src={imagensAcervo[a]}></Image>
        </Done>
      );
    }
    if (startHorarios[a] > data) {
      cssCombine.push({
        pointerEvents: "none" as React.CSSProperties["pointerEvents"],
      });
      return (
        <Block>
          <Image className="porBaixo" src={imagensAcervo[a]}></Image>
        </Block>
      );
    }
    cssCombine.push({});
    return (
      <Default onComplete={() => handleStatus(a, true)}>
        <Image className="porBaixo" src={imagensAcervo[a]}></Image>
      </Default>
    );
  };

  useEffect(() => {
    onAuthStateChanged(auth, (user) => {
      if (user && !load) {
        load = true;
        fetchPost();
      }
    });
  }, []);

  function getStringValue(value: any): string {
    return String(value);
  }

  //MODAL
  const [show, setShow] = useState([false, false, false, false, false, false]);

  const setTodo = async (auxArr: boolean[]) => {
    const temp = getStringValue(auth.currentUser?.uid);
    if (temp !== undefined) {
      await setDoc(doc(db, temp, "bloqueados"), {
        0: auxArr[0],
        1: auxArr[1],
        2: auxArr[2],
        3: auxArr[3],
        4: auxArr[4],
        5: auxArr[5],
      });
    }
  };

  const handleStatus = (a: number, b: boolean) => {
    if (b) {
      let temp = [];
      for (let i = 0; i < 6; i++) {
        if (i < a + 1) {
          temp.push(true);
        } else {
          if (finalizadosBool[i]) {
            temp.push(true);
          } else {
            temp.push(false);
          }
        }
      }
      if (temp.length - 1 !== a) {
        if (!temp[a + 1]) {
          setTodo(temp);
        }
      }
    }

    console.log("Show", a, b, show);
    setShow(
      update(show, {
        [a]: {
          $set: b,
        },
      })
    );
  };

  const stringCustomStyle = {
    borderRightWidth: "inherit",
    borderStyle: "solid",
    borderColor: "white",
    borderWidth: "5px 5px 5px 0",
    borderRadius: "5px",
  };

  return (
    <>
      <Row className="m-0 p-0">
        <Col
          className="p-0 ms-0 mt-0 me-0 mb-0 text-nowrap"
          style={{ marginTop: "5vh" }}
        >
          <div
            className="inline"
            style={Object.assign({}, stringCustomStyle, cssCombine[0])}
          >
            {finalizados[0]}
          </div>

          <div
            className="inline"
            style={Object.assign({}, stringCustomStyle, cssCombine[1])}
          >
            {finalizados[1]}
          </div>

          <div
            className="inline"
            style={Object.assign({}, stringCustomStyle, cssCombine[2])}
          >
            {finalizados[2]}
          </div>

          <div
            className="inline"
            style={Object.assign({}, stringCustomStyle, cssCombine[3])}
          >
            {finalizados[3]}
          </div>

          <div
            className="inline"
            style={Object.assign({}, stringCustomStyle, cssCombine[4])}
          >
            {finalizados[4]}
          </div>

          <div
            className="inline"
            style={Object.assign({}, stringCustomStyle, cssCombine[5])}
          >
            {finalizados[5]}
          </div>
        </Col>
      </Row>

      <Modal
        className="animate__bounceIn"
        show={show[0]}
        onHide={() => handleStatus(0, false)}
      >
        <Modal.Header className="text-center" closeButton>
          <Modal.Title style={{ fontSize: "1.3em", textAlign: "center" }}>
            {" "}
            Hey Broto, vamos ver um filme lá em casa? 👀{" "}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Image
            src={imagensAcervo[0]}
            style={{ borderRadius: "0%", height: "81vh", width: "27vh" }}
          ></Image>
        </Modal.Body>
      </Modal>

      <Modal
        className="animate__bounceIn"
        show={show[1]}
        onHide={() => handleStatus(1, false)}
      >
        <Modal.Header closeButton>
          <Modal.Title style={{ fontSize: "1em", textAlign: "center" }}>
            {" "}
            NÃO TEM MORTE DE NENHUMA DE ANIMAL EU PESQUISEI! 🍿{" "}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Image
            className="modalImage"
            src={imagensAcervo[1]}
            style={{ borderRadius: "0%", height: "81vh", width: "27vh" }}
          ></Image>
        </Modal.Body>
      </Modal>

      <Modal
        className="animate__bounceIn"
        show={show[2]}
        onHide={() => handleStatus(2, false)}
      >
        <Modal.Header closeButton>
          <Modal.Title style={{ fontSize: "1.2em", textAlign: "center" }}>
            {" "}
            SURPRESAAAAAAAAA!!!!! Espero que sirva :) 🥳
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Image
            src={imagensAcervo[2]}
            style={{ borderRadius: "0%", height: "81vh", width: "24vh" }}
          ></Image>
        </Modal.Body>
        <Confetti width={window.innerWidth} height={window.innerHeight} />
      </Modal>

      <Modal
        className="animate__bounceIn"
        show={show[3]}
        onHide={() => handleStatus(3, false)}
      >
        <Modal.Header closeButton>
          <Modal.Title style={{ fontSize: "1.3em", textAlign: "center" }}>
            {" "}
            🥃🧉🍹🍷{" "}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Image
            src={imagensAcervo[3]}
            style={{ borderRadius: "0%", height: "81vh", width: "27vh" }}
          ></Image>
        </Modal.Body>
      </Modal>

      <Modal
        className="animate__bounceIn"
        show={show[4]}
        onHide={() => handleStatus(4, false)}
      >
        <Modal.Header closeButton>
          <Modal.Title style={{ fontSize: "1.5em", textAlign: "center" }}>
            {" "}
            PIN PIN PIN, GANHOU +1 RODADA! 🤪{" "}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Image
            src={imagensAcervo[4]}
            style={{ borderRadius: "0%", height: "81vh", width: "27vh" }}
          ></Image>
        </Modal.Body>
        <Confetti width={window.innerWidth} height={window.innerHeight} />
      </Modal>

      <Modal
        className="animate__bounceIn"
        show={show[5]}
        onHide={() => handleStatus(5, false)}
      >
        <Modal.Header closeButton>
          <Modal.Title style={{ fontSize: "1.3em", textAlign: "center" }}>
            {" "}
            Ganhou um Gift Card bem ilustrativo... 🤫👻{" "}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Image
            src={imagensAcervo[5]}
            style={{ borderRadius: "0%", height: "81vh", width: "27vh" }}
          ></Image>
        </Modal.Body>
        <Confetti
          width={window.innerWidth}
          height={window.innerHeight}
          numberOfPieces={50}
        />
      </Modal>
    </>
  );
}

export default Surprise;
