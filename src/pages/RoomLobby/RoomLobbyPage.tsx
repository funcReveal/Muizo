import { useParams } from "react-router-dom";

import RoomChatPage from "../RoomChatPage/RoomChatPage";

const RoomLobbyPage: React.FC = () => {
  const { roomId } = useParams<{ roomId?: string }>();
  return <RoomChatPage routeRoomId={roomId ?? null} initialView="list" />;
};

export default RoomLobbyPage;
