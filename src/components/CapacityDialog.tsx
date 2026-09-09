import { Download, Bike, BusFront, Car, Info, Footprints, ShieldCheck } from "lucide-react";
import type { StreetDocument } from "../data/editor";
import { calculateCapacity } from "../data/analytics";
import { DEFS } from "../data/street";
import { formatMetres } from "../data/standards";
import { Modal } from "./Chrome";

interface CapacityDialogProps {
  street: StreetDocument;
  onClose: () => void;
}

export function CapacityDialog({ street, onClose }: CapacityDialogProps) {
  const cap = calculateCapacity(street.segments);
  const total = cap.total || 1;

  const pct = (val: number) => Math.round((val / total) * 100);
  const widthPct = (w: number) =>
    cap.totalWidth > 0 ? Math.round((w / cap.totalWidth) * 100) : 0;

  const downloadCsv = () => {
    const rows = [
      ["Segment #", "Element", "Width (m)", "Category", "Hourly Capacity (people/hr)"],
      ...street.segments.map((seg, i) => {
        const def = DEFS[seg.type];
        const segCap = calculateCapacity([seg]).total;
        return [
          String(i + 1),
          def.label,
          String(seg.w),
          def.group,
          String(segCap),
        ];
      }),
      ["", "TOTAL", String(cap.totalWidth), "", String(cap.total)],
    ];

    const csvContent = "data:text/csv;charset=utf-8," + rows.map((e) => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${street.name.replace(/[^a-z0-9-]/gi, "-")}-capacity.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const activeTransitCap = cap.pedestrian + cap.cycling + cap.transit;
  const activeTransitPct = pct(activeTransitCap);
  const activeTransitWidthPct = widthPct(cap.pedestrianWidth + cap.cyclingWidth + cap.transitWidth);

  return (
    <Modal title="Street Capacity & Analytics" onClose={onClose} wide>
      <div className="capacity-dialog">
        {/* Big hero metric */}
        <div className="capacity-hero">
          <div className="capacity-hero-value">
            <strong>{cap.total.toLocaleString()}</strong>
            <span>people / hour</span>
          </div>
          <p className="capacity-hero-sub">
            Total people-moving capacity of <strong>{street.name}</strong> across all travel modes.
          </p>
        </div>

        {/* Modal shares */}
        <div className="capacity-modes">
          <div className="capacity-mode-card mode-pedestrian">
            <div className="mode-header">
              <span className="mode-icon"><Footprints size={16} /></span>
              <span className="mode-name">Pedestrians</span>
              <strong className="mode-value">{cap.pedestrian.toLocaleString()}</strong>
            </div>
            <div className="mode-bar-track">
              <div className="mode-bar-fill" style={{ width: `${pct(cap.pedestrian)}%`, background: "#397f95" }} />
            </div>
            <div className="mode-meta">
              <span>{pct(cap.pedestrian)}% of capacity</span>
              <span>{widthPct(cap.pedestrianWidth)}% of width ({formatMetres(cap.pedestrianWidth)} m)</span>
            </div>
          </div>

          <div className="capacity-mode-card mode-cycling">
            <div className="mode-header">
              <span className="mode-icon"><Bike size={16} /></span>
              <span className="mode-name">Bikes &amp; Scooters</span>
              <strong className="mode-value">{cap.cycling.toLocaleString()}</strong>
            </div>
            <div className="mode-bar-track">
              <div className="mode-bar-fill" style={{ width: `${pct(cap.cycling)}%`, background: "#2c7655" }} />
            </div>
            <div className="mode-meta">
              <span>{pct(cap.cycling)}% of capacity</span>
              <span>{widthPct(cap.cyclingWidth)}% of width ({formatMetres(cap.cyclingWidth)} m)</span>
            </div>
          </div>

          <div className="capacity-mode-card mode-transit">
            <div className="mode-header">
              <span className="mode-icon"><BusFront size={16} /></span>
              <span className="mode-name">Public Transit</span>
              <strong className="mode-value">{cap.transit.toLocaleString()}</strong>
            </div>
            <div className="mode-bar-track">
              <div className="mode-bar-fill" style={{ width: `${pct(cap.transit)}%`, background: "#89534c" }} />
            </div>
            <div className="mode-meta">
              <span>{pct(cap.transit)}% of capacity</span>
              <span>{widthPct(cap.transitWidth)}% of width ({formatMetres(cap.transitWidth)} m)</span>
            </div>
          </div>

          <div className="capacity-mode-card mode-driving">
            <div className="mode-header">
              <span className="mode-icon"><Car size={16} /></span>
              <span className="mode-name">Motor Vehicles</span>
              <strong className="mode-value">{cap.driving.toLocaleString()}</strong>
            </div>
            <div className="mode-bar-track">
              <div className="mode-bar-fill" style={{ width: `${pct(cap.driving)}%`, background: "#4a4a44" }} />
            </div>
            <div className="mode-meta">
              <span>{pct(cap.driving)}% of capacity</span>
              <span>{widthPct(cap.drivingWidth)}% of width ({formatMetres(cap.drivingWidth)} m)</span>
            </div>
          </div>
        </div>

        {/* Insight note */}
        <div className="capacity-insight">
          <Info size={18} className="shrink-0 text-[#258ba2]" />
          <div>
            <strong>Space Efficiency Insight</strong>
            <p>
              {activeTransitCap > 0 ? (
                <>
                  Transit, walking, and cycling account for <strong>{activeTransitPct}%</strong> of total people-moving capacity while occupying <strong>{activeTransitWidthPct}%</strong> of the street's physical width.
                </>
              ) : (
                <>Add sidewalks, bike lanes, or transit lanes to significantly multiply your street's hourly throughput.</>
              )}
            </p>
          </div>
        </div>

        {/* Segment table preview */}
        <div className="capacity-table-container">
          <table className="capacity-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Lane / Segment</th>
                <th>Width</th>
                <th>Mode</th>
                <th>Capacity</th>
              </tr>
            </thead>
            <tbody>
              {street.segments.map((seg, i) => {
                const def = DEFS[seg.type];
                const segCap = calculateCapacity([seg]).total;
                return (
                  <tr key={seg.id}>
                    <td>{i + 1}</td>
                    <td><strong>{def.label}</strong></td>
                    <td>{formatMetres(seg.w)} m</td>
                    <td>{def.group}</td>
                    <td>{segCap > 0 ? `${segCap.toLocaleString()} p/hr` : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="capacity-actions">
          <p className="capacity-source">
            <ShieldCheck size={14} /> Capacity figures based on NACTO Transit Street Design Guide &amp; Urban Street Design standards.
          </p>
          <button className="capacity-csv-button" onClick={downloadCsv}>
            <Download size={14} /> Export CSV summary
          </button>
        </div>
      </div>
    </Modal>
  );
}
