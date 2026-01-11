import { useParams } from "react-router-dom";

import RoomChatPage from "../RoomChatPage/RoomChatPage";

const InvitedPage: React.FC = () => {
  const { roomId } = useParams<{ roomId?: string }>();
  return <RoomChatPage inviteId={roomId ?? null} initialView="create" />;
};

export default InvitedPage;
