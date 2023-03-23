import { Action } from "../shared/models/action.interface";
import { InputState } from "./model/InputState.interface";
import {
  InputActionType,
  INPUT_ACTION_BLUR,
  INPUT_ACTION_CHANGE,
  INPUT_ACTION_CLEAR,
} from "./model/InputAction";
import { ChangeEvent, useReducer } from "react";

const InitialInputState: InputState = {
  text: "",
  hasBeenTouched: false,
};

const inputReducer = (state: InputState, action: Action<InputActionType>) => {
  const { type, value = "" } = action;

  switch (type) {
    case INPUT_ACTION_CHANGE:
      return { text: value, hasBeenTouched: state.hasBeenTouched };
    case INPUT_ACTION_BLUR:
      return { text: state.text, hasBeenTouched: true };
    case INPUT_ACTION_CLEAR:
      return { text: "", hasBeenTouched: false };

    default:
      return { ...state };
  }
};

const useInput = () => {
    const [{ text, hasBeenTouched }, dispach] = useReducer (
        inputReducer,
        InitialInputState
    );

    const textChangeHandler = (e: ChangeEvent<HTMLInputElement>) => {
        dispach({ type: INPUT_ACTION_CHANGE, value: e.target.value });

    }

    const inputBlurHandler = (e: ChangeEvent<HTMLInputElement>) => {
        dispach({ type: INPUT_ACTION_BLUR});

    }

    const clearHandler = (e: ChangeEvent<HTMLInputElement>) => {
        dispach({ type: INPUT_ACTION_CLEAR });

    }

    return {
        text, 

        textChangeHandler,
        inputBlurHandler,
        clearHandler
    }
};

export default useInput
