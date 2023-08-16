import styled from "styled-components";

export const Container = styled.div`
  position: fixed;
  bottom: 15px;
  right: 15px;
  background: #fff;
  padding: 15px;
  z-index: 3;
  border-radius: 15px;
  box-shadow: 0px -4px 0px 0px rgba(0, 0, 0, 0.1);
  width: 370px;

  @media (max-width: 414px) and (max-height: 896px) {
    width: 100%;
    height: auto;
    right: 0;
    bottom: 0;
  }
`;

export const Header = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  margin-bottom: 15px;
  margin-top: 5px;
`;

export const Text = styled.div`
  color: #000;
`;