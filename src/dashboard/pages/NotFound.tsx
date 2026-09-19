import { Link } from "react-router";
import { Compass } from "lucide-react";
import { Card, Empty } from "../ui/kit";

export default function NotFound() {
  return (
    <Card>
      <Empty
        icon={<Compass size={22} />}
        title="This page doesn't exist"
        action={
          <Link className="btn btn-pri" to="/app">
            Back to overview
          </Link>
        }
      >
        The link may be outdated, or the page moved.
      </Empty>
    </Card>
  );
}
