import { useState } from "react";
import { useFetcher } from "react-router";
import { authenticate } from "../shopify.server";
import { connectDB , Announcement} from "../mdb.server";


export async function action({ request }) {
  const { admin } = await authenticate.admin(request);
  const formData = await request.formData();
  const text = formData.get("announcement");

  // First get the real shop ID
  const shopResponse = await admin.graphql(`
    query { shop { id } }
  `);
  const shopData = await shopResponse.json();
  const shopId = shopData.data.shop.id;

  await admin.graphql(`
    mutation metafieldsSet($value: String!, $ownerId: ID!) {
      metafieldsSet(metafields: [{
        namespace: "my_app"
        key: "announcement"
        ownerId: $ownerId
        type: "single_line_text_field"
        value: $value
      }]) {
        metafields { id }
        userErrors { field message }
      }
    }
  `, { variables: { value: text, ownerId: shopId } });

  await connectDB();
await Announcement.create({ text });
  return { success: true };
}

export default function Index() {
  const fetcher = useFetcher();
  const [text, setText] = useState("");
  const isLoading = fetcher.state !== "idle";
  const success = fetcher.data?.success;

  return (
    <div style={{ padding: "20px", maxWidth: "600px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "24px", marginBottom: "20px" }}>
        Announcement Banner
      </h1>

      {success && (
        <div style={{
          background: "#d4edda",
          border: "1px solid #c3e6cb",
          borderRadius: "4px",
          padding: "12px 16px",
          marginBottom: "16px",
          color: "#155724"
        }}>
          ✅ Announcement saved and synced to your store!
        </div>
      )}

      <fetcher.Form method="post">
        <div style={{ marginBottom: "16px" }}>
          <label style={{ display: "block", marginBottom: "6px", fontWeight: "500" }}>
            Announcement Text
          </label>
          <input
            name="announcement"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="e.g. Sale 50% Off today only!"
            style={{
              width: "100%",
              padding: "8px 12px",
              border: "1px solid #ccc",
              borderRadius: "4px",
              fontSize: "14px",
              boxSizing: "border-box"
            }}
          />
        </div>
        <button
          type="submit"
          disabled={isLoading}
          style={{
            background: "#008060",
            color: "white",
            border: "none",
            padding: "10px 20px",
            borderRadius: "4px",
            cursor: isLoading ? "not-allowed" : "pointer",
            fontSize: "14px"
          }}
        >
          {isLoading ? "Saving..." : "Save"}
        </button>
      </fetcher.Form>
    </div>
  );
}