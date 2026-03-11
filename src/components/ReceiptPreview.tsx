import type { Order, Shop } from "../lib/types";
import { formatCurrency, fmtDateTime } from "../lib/utils";

interface ReceiptPreviewProps {
  order: Order;
  shop: Shop;
  onPrint: () => void;
  onCancel: () => void;
  printing?: boolean;
}

export function ReceiptPreview({ order, shop, onPrint, onCancel, printing }: ReceiptPreviewProps) {
  const c = shop.currency || "\u20B1";
  const width = shop.receiptPaperWidth === 80 ? 400 : 280;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "rgba(0,0,0,0.6)", display: "flex",
      alignItems: "center", justifyContent: "center",
    }}>
      <div style={{
        background: "#fff", borderRadius: 12, padding: 0, maxHeight: "90vh",
        display: "flex", flexDirection: "column", width: width + 40,
      }}>
        {/* Receipt */}
        <div style={{
          padding: 20, overflowY: "auto", fontFamily: "'Courier New', monospace",
          fontSize: 13, color: "#111", lineHeight: 1.5,
          maxWidth: width, margin: "0 auto",
        }}>
          {/* Shop header */}
          <div style={{ textAlign: "center", marginBottom: 10 }}>
            <div style={{ fontSize: 17, fontWeight: 800 }}>{shop.name}</div>
            <div style={{ fontSize: 11, color: "#555" }}>{shop.address}</div>
            <div style={{ fontSize: 11, color: "#555" }}>{shop.phone}</div>
          </div>
          <hr style={{ border: "none", borderTop: "2px dashed #aaa", margin: "10px 0" }} />

          {/* Order info */}
          <div style={{ marginBottom: 8 }}>
            <Row left="Order #" right={order.orderNum} bold />
            <Row left="Customer" right={order.customerName} />
            {order.customerPhone && <Row left="Phone" right={order.customerPhone} />}
            <Row left="Date" right={fmtDateTime(order.createdAt, shop)} />
            {order.express && (
              <div style={{ color: "#d97706", fontWeight: 700 }}>EXPRESS ORDER</div>
            )}
          </div>
          <hr style={{ border: "none", borderTop: "2px dashed #aaa", margin: "10px 0" }} />

          {/* Items */}
          {order.items.map((item, i) => {
            let desc = item.serviceName;
            if (item.express) desc += " [E]";
            if (item.pricingType === "PER_KG") desc += ` ${item.kg}kg`;
            if (item.pricingType === "FIXED_LOAD") desc += " (fixed)";
            if (item.pricingType !== "PER_KG" && item.qty > 1) desc += ` x${item.qty}`;
            return (
              <Row key={i} left={desc} right={`${c}${item.subtotal.toLocaleString()}`}
                style={{ borderBottom: "1px dashed #ddd", padding: "4px 0" }} />
            );
          })}
          <hr style={{ border: "none", borderTop: "2px dashed #aaa", margin: "10px 0" }} />

          {/* Totals */}
          {order.discount > 0 && (
            <Row left="Discount" right={`-${c}${order.discount.toLocaleString()}`}
              style={{ color: "#16a34a" }} />
          )}
          <Row left="TOTAL" right={`${c}${order.total.toLocaleString()}`}
            bold style={{ fontSize: 16, padding: "8px 0 4px" }} />
          <Row left="Paid via" right={order.paymentMethod || "Cash"} />
          {order.isCashPayment && order.cashTendered != null && (
            <>
              <Row left="Cash" right={`${c}${(order.cashTendered || 0).toLocaleString()}`} />
              <Row left="Change" right={`${c}${(order.change || 0).toLocaleString()}`} />
            </>
          )}
          <hr style={{ border: "none", borderTop: "2px dashed #aaa", margin: "10px 0" }} />

          {/* Footer */}
          <div style={{ textAlign: "center", fontSize: 11, color: "#777", lineHeight: 1.6 }}>
            Thank you for choosing {shop.name}!<br />
            Please keep this receipt for reference.
          </div>
        </div>

        {/* Buttons */}
        <div style={{
          display: "flex", gap: 10, padding: "12px 20px",
          borderTop: "1px solid #e5e7eb",
        }}>
          <button onClick={onCancel} disabled={printing} style={{
            flex: 1, padding: 12, background: "#f3f4f6", border: "1px solid #d1d5db",
            borderRadius: 8, cursor: "pointer", fontFamily: "monospace",
            fontSize: 14, fontWeight: 600,
          }}>Cancel</button>
          <button onClick={onPrint} disabled={printing} style={{
            flex: 1, padding: 12, background: "#2563EB", color: "#fff",
            border: "none", borderRadius: 8, cursor: "pointer",
            fontFamily: "monospace", fontSize: 14, fontWeight: 700,
            opacity: printing ? 0.6 : 1,
          }}>{printing ? "Printing..." : "Print"}</button>
        </div>
      </div>
    </div>
  );
}

function Row({ left, right, bold, style }: {
  left: string; right: string; bold?: boolean; style?: React.CSSProperties;
}) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between",
      fontWeight: bold ? 700 : 400, ...style,
    }}>
      <span>{left}</span>
      <span>{right}</span>
    </div>
  );
}
