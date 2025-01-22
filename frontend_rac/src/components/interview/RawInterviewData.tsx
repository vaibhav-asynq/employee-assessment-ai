import React from 'react';
import { InterviewAnalysis } from '@/lib/types';

interface RawInterviewDataProps {
  data: InterviewAnalysis;
}

export function RawInterviewData({ data }: RawInterviewDataProps) {
  return (
    <div className="space-y-8 p-6">
      <h2 className="text-2xl font-bold tracking-tight">Raw Interview Data</h2>
      
      {/* Strengths Evidence Section */}
      <section className="space-y-6">
        <h3 className="text-xl font-semibold text-gray-900">STRENGTHS EVIDENCE</h3>
        <p className="text-gray-600">Below are grouped quotes that directly support each of Ian Fujiyama's strengths.</p>
        
        <div className="space-y-8">
          {/* Strategic Leadership Section */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-800">Strategic Leadership & Investment Excellence</h4>
            <ul className="space-y-4">
              <li className="space-y-2">
                <p className="font-medium">Martin Sumner (Sector Head - Industrials):</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>"Ian gave me the shot... Highly analytical, wicked smart."</li>
                  <li>"100% results focused: he doesn't care at all about face time or non-value-added stuff, it's all points on the board."</li>
                </ul>
              </li>

              <li className="space-y-2">
                <p className="font-medium">Doug Brandely (MD for A&D, Direct Report):</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>"Outstanding investment judgment: quick read, able to zero in on the critical factors."</li>
                  <li>"Efficient: kills bad opportunities quickly, doesn't waste people's time, makes decisions fast."</li>
                  <li>"High degree of business acumen, a strategic thinker: outstanding at providing guidance for our portfolio companies."</li>
                </ul>
              </li>

              <li className="space-y-2">
                <p className="font-medium">Aaron Hurwitz (Principal):</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>"The smartest person I know, really quickly gets things and processes information."</li>
                  <li>"90% accurate, makes the right call."</li>
                  <li>"Solid at exiting, no conflicts there."</li>
                </ul>
              </li>

              <li className="space-y-2">
                <p className="font-medium">Mark Marengo (JP Morgan MD):</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>"He knows how to put deals together expertly... He empowers his team to run their respective areas."</li>
                </ul>
              </li>

              <li className="space-y-2">
                <p className="font-medium">Matt Tait (Senior External Stakeholder):</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>"Strategic thinker with a breadth of experience on company boards, good insights into what to focus on to make the journey a success."</li>
                  <li>"Ian was part of what made Carlyle's A&D sector the one that put the firm on the map."</li>
                </ul>
              </li>
            </ul>
          </div>

          {/* People Development Section */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-800">People Development & Collaborative Leadership</h4>
            <ul className="space-y-4">
              <li className="space-y-2">
                <p className="font-medium">Matt Tait:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>"I've witnessed him build that next generation of leadership: he has two people leading verticals who are both fantastic, client-oriented, detail-focused, well-coached, and super talented."</li>
                </ul>
              </li>

              <li className="space-y-2">
                <p className="font-medium">Doug Brandely:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>"Ian gives the team room to operate."</li>
                  <li>"He thinks about how we are structured and operate as a team."</li>
                </ul>
              </li>

              <li className="space-y-2">
                <p className="font-medium">Anna Mire (VP, Direct Report):</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>"He is a tone-setter, keeping the group cohesive and united."</li>
                </ul>
              </li>

              <li className="space-y-2">
                <p className="font-medium">Wil Langenstein (Principal, Direct Report):</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>"He's super thoughtful and strong as a leader in giving room to run; a concerted effort to let others elevate themselves."</li>
                  <li>"He empowers and elevates them, spotting and growing talent."</li>
                </ul>
              </li>

              <li className="space-y-2">
                <p className="font-medium">Dayne Baird (MD Direct Report):</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>"Developing people, really works through the programs I needed to improve something I wanted to work on."</li>
                  <li>"He's a champion for people's careers here, celebrates the performance of people on the team, gets the word out, which generates a lot of loyalty."</li>
                </ul>
              </li>
            </ul>
          </div>

          {/* Stakeholder Management Section */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-800">Stakeholder Management & Industry Expertise</h4>
            <ul className="space-y-4">
              <li className="space-y-2">
                <p className="font-medium">Matt Tait:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>"He is Mister A&D; the sector that put Carlyle on the map. Every client knows he is the person to call."</li>
                  <li>"His read of people is great: a mix of charm and good judgment."</li>
                </ul>
              </li>

              <li className="space-y-2">
                <p className="font-medium">Martin Sumner:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>"Strategic thoughts without making you feel like he's smarter than you."</li>
                  <li>"He's an independent, balanced voice who is trustworthy."</li>
                </ul>
              </li>

              <li className="space-y-2">
                <p className="font-medium">Joe Logue (External Stakeholder, CEO):</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>"He focuses heavily on negotiations... a chess player and shrewd negotiator."</li>
                  <li>"World-class team at working with the government sector, the team is Carlyle's heritage, and Ian gave them room to develop."</li>
                </ul>
              </li>

              <li className="space-y-2">
                <p className="font-medium">Anna Mire:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>"Known as extremely knowledgeable, very smart."</li>
                  <li>"He presents well, credible."</li>
                </ul>
              </li>

              <li className="space-y-2">
                <p className="font-medium">Aaron Hurwitz:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>"Collaborative approach and situational awareness around constituents and factors in decision-making."</li>
                </ul>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Areas to Target Evidence Section */}
      <section className="space-y-6">
        <h3 className="text-xl font-semibold text-gray-900">AREAS TO TARGET EVIDENCE</h3>
        <p className="text-gray-600">Below are grouped quotes that illustrate Ian Fujiyama's developmental opportunities.</p>
        
        <div className="space-y-8">
          {/* Strategic Influence */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-800">Strategic Influence</h4>
            <ul className="space-y-4">
              <li className="space-y-2">
                <p className="font-medium">Joe Logue:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>"He doesn't command the room... not bad, but he's not the onstage guy."</li>
                  <li>"He shies away from the spotlight, and that takes away from his content."</li>
                  <li>"When he talks, people listen: he just needs to embrace it and use it for good."</li>
                </ul>
              </li>

              <li className="space-y-2">
                <p className="font-medium">Aaron Hurwitz:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>"Lots of conferences and panels in the DC area for our business, but he explicitly avoids those."</li>
                  <li>"We need to do some brand building in aerospace, for example."</li>
                </ul>
              </li>

              <li className="space-y-2">
                <p className="font-medium">Anna Mire:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>"He can push his brand more on the inside; politics, not the results, win the day."</li>
                </ul>
              </li>
            </ul>
          </div>

          {/* Talent Acceleration */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-800">Talent Acceleration</h4>
            <ul className="space-y-4">
              <li className="space-y-2">
                <p className="font-medium">Wil Langenstein:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>"We need more frequent feedback on how we're doing, especially the informal stuff."</li>
                  <li>"He could facilitate and be more involved with others' development because he has a lot of resources, like an incredible network that can help us in our own careers."</li>
                </ul>
              </li>

              <li className="space-y-2">
                <p className="font-medium">Doug Brandely:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>"Less direct coaching and teaching, could be more involved and engaged in active coaching during the day-to-day work, teaching others how he thinks (especially more junior people)."</li>
                </ul>
              </li>

              <li className="space-y-2">
                <p className="font-medium">Dayne Baird:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>"Like a lot of people at Carlyle, he avoids tough conversations and pulling the trigger on poor performers."</li>
                </ul>
              </li>

              <li className="space-y-2">
                <p className="font-medium">Aaron Hurwitz:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>"Not sure he's mentoring anymore, but he has the skill."</li>
                </ul>
              </li>
            </ul>
          </div>

          {/* Directive Leadership */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-800">Directive Leadership</h4>
            <ul className="space-y-4">
              <li className="space-y-2">
                <p className="font-medium">Anna Mire:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>"He could save time with a more direct style rather than gently guiding those around him."</li>
                </ul>
              </li>

              <li className="space-y-2">
                <p className="font-medium">Wil Langenstein:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>"Email communication can look apathetic because he will send a quick, brief response, even though he has read through and looked at things deeply."</li>
                  <li>"Communication in general around direction, deadlines, and expectations could be more explicit (because trying not to be overly involved can send mixed signals)."</li>
                </ul>
              </li>

              <li className="space-y-2">
                <p className="font-medium">Joe Logue:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>"He doesn't command the room, but he should be. He's the chess player, but sometimes he plays from behind the curtain."</li>
                </ul>
              </li>
            </ul>
          </div>

          {/* Organizational Presence */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-800">Organizational Presence</h4>
            <ul className="space-y-4">
              <li className="space-y-2">
                <p className="font-medium">Doug Brandely:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>"Can do even more team-building activities, particularly being with the team physically in person."</li>
                  <li>"His split presence sometimes affects the frequency and consistency of team interactions across locations."</li>
                </ul>
              </li>

              <li className="space-y-2">
                <p className="font-medium">Dayne Baird:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>"People are in the office less nowadays, so I bump into him less... but he could make himself more available when in the office."</li>
                </ul>
              </li>

              <li className="space-y-2">
                <p className="font-medium">Aaron Hurwitz:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>"Recently an empty nester, but he needs to be deliberate about being present (e.g., more Zoom when he's in NY)."</li>
                </ul>
              </li>

              <li className="space-y-2">
                <p className="font-medium">Martin Sumner:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>"Even more team-building activities would help (he's done a great job but could push it further)."</li>
                </ul>
              </li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}