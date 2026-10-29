import type { Metadata } from "next";
import Image from "next/image";
import { promise, story } from "@/content/story";

export const metadata: Metadata = { title: "About Us" };

export default function About() {
  return (
    <div className="section container narrow">
      <div className="about-logo">
        <Image src="/images/site/logo-vertical.webp" alt="YANA Chocolateria" width={180} height={248} />
      </div>
      <h1 className="page-title">{promise.title}</h1>
      <p className="lead">{promise.body}</p>
      {story.map((s) => (
        <section key={s.title} className="story">
          <h2>{s.title}</h2>
          <p>{s.body}</p>
        </section>
      ))}
    </div>
  );
}
