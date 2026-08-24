import React, { useState } from "react";
import chatIcon from "../assets/chat.png";
import toast from "react-hot-toast";
import { createRoomApi, joinChatApi } from "../services/RoomService";
import useChatContext from "../context/ChatContext";
import { useNavigate } from "react-router";
const JoinCreateChat = () => {
  const [detail, setDetail] = useState({
    roomId: "",
    userName: "",
  });

  const { roomId, userName, setRoomId, setCurrentUser, setConnected } =
    useChatContext();
  const navigate = useNavigate();

  function handleFormInputChange(event) {
    setDetail({
      ...detail,
      [event.target.name]: event.target.value,
    });
  }

  function validateForm() {
    if (detail.roomId === "" || detail.userName === "") {
      toast.error("Invalid Input !!");
      return false;
    }
    return true;
  }

  async function joinChat() {
    if (validateForm()) {
      //join chat

      try {
        const room = await joinChatApi(detail.roomId);
        toast.success("joined..");
        setCurrentUser(detail.userName);
        setRoomId(room.roomId);
        setConnected(true);
        navigate("/chat");
      } catch (error) {
        if (error.status == 400) {
          toast.error(error.response.data);
        } else {
          toast.error("Error in joining room");
        }
        console.log(error);
      }
    }
  }

  async function createRoom() {
    if (validateForm()) {
      //create room
      console.log(detail);
      // call api to create room on backend
      try {
        const response = await createRoomApi(detail.roomId);
        console.log(response);
        toast.success("Room Created Successfully !!");
        //join the room
        setCurrentUser(detail.userName);
        setRoomId(response.roomId);
        setConnected(true);

        navigate("/chat");

        //forward to chat page...
      } catch (error) {
        console.log(error);
        if (error.status == 400) {
          toast.error("Room  already exists !!");
        } else {
          toast("Error in creating room");
        }
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center ">
      <div className="p-10 dark:border-gray-700 border w-full flex flex-col gap-5 max-w-md rounded dark:bg-gray-900 shadow">
        <div>
          <img src={chatIcon} className="w-24 mx-auto" />
        </div>

        <h1 className="text-2xl font-semibold text-center ">
          Join Room / Create Room ..
        </h1>
        {/* name div */}
        <div className="">
          <label htmlFor="name" className="block font-medium mb-2">
            Your name
          </label>
          <input
            onChange={handleFormInputChange}
            value={detail.userName}
            type="text"
            id="name"
            name="userName"
            placeholder="Enter the name"
            className="w-full dark:bg-gray-600 px-4 py-2 border dark:border-gray-600 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* room id div */}
        <div className="">
          <label htmlFor="name" className="block font-medium mb-2">
            Room ID / New Room ID
          </label>
          <input
            name="roomId"
            onChange={handleFormInputChange}
            value={detail.roomId}
            type="text"
            id="name"
            placeholder="Enter the room id"
            className="w-full dark:bg-gray-600 px-4 py-2 border dark:border-gray-600 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* button  */}
        <div className="flex justify-center gap-2 mt-4">
          <button
            onClick={joinChat}
            className="px-3 py-2 dark:bg-blue-500 hover:dark:bg-blue-800 rounded-full"
          >
            Join Room
          </button>
          <button
            onClick={createRoom}
            className="px-3 py-2 dark:bg-orange-500 hover:dark:bg-orange-800 rounded-full"
          >
            Create Room
          </button>
        </div>
      </div>
    </div>
  );
};

export default JoinCreateChat;