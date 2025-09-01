import { NextPage } from "next";
import { useSession } from "next-auth/react";

import Layout from "../components/Layout";

const Catalog: NextPage = () => {
  const { data: session } = useSession();
  return (
    <Layout>
      {session ? (
        <>
          <h2 className="mb-3 text-center text-3xl">קטלוג המקהלה</h2>
          <h3 className="mb-3 mt-2 text-center text-2xl">קישורים שימושיים</h3>
          <ul className="list-inside list-disc pb-6 pl-5 text-sm">
            <li>
              תיקיית תפקידים:{" "}
              <a
                href="https://drive.google.com/drive/folders/1mszai8XKg5bQhAxK7jTKWn7F2b72XJgO?usp=sharing"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline"
              >
                קישור
              </a>
            </li>
            <li>
              הגשת תכנים לפטריאון:{" "}
              <a
                href="https://forms.gle/zR1E19AiRmE33BCf8"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline"
              >
                קישור
              </a>
            </li>
            <li>
              רשימות מלאכים:{" "}
              <a
                href="https://drive.google.com/drive/folders/1ZVviXQHZOA1kjPZDT5jrG8gwwDkTJzpE?usp=sharing"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline"
              >
                קישור
              </a>
            </li>
            <li>
              תקיית כוריאוגרפיה:{" "}
              <a
                href="https://drive.google.com/file/d/1_7jaORzG6FuB5W1-q-cnYLukHfglonBi"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline"
              >
                קישור
              </a>
            </li>
            <li>
              טבלת טראבלשוטינג והופעות:{" "}
              <a
                href="https://docs.google.com/spreadsheets/d/1S_tzfuv2JKFbEkWvarmMsGOIJnTZVmuYJAc9Lyy3pG0/edit?usp=sharing"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline"
              >
                קישור
              </a>
            </li>
            <li>
              מסמך הלסלור:{" "}
              <a
                href="https://docs.google.com/document/d/1cYxNm-NZu0wKAJfWaASZHES9Ou2GZ8TrQxjsUp9D_YI/edit?usp=sharing"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline"
              >
                קישור
              </a>
            </li>
            <li>
              אקסל צילומי סושיאל:{" "}
              <a
                href="https://docs.google.com/spreadsheets/d/19OhGFO2hGF-W-i1R_Qc0XpGuCq00ySxgSNcDvrlM8iI/edit?usp=drivesdk"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline"
              >
                קישור
              </a>
            </li>
          </ul>
          <h3 className="mb-3 mt-2 text-center text-2xl">קבוצות ווטסאפ</h3>
          <ul className="list-inside list-disc pb-6 pl-5 text-sm">
            <li>
              קבוצת טיפים ואימון שירה (מומלץ!):{" "}
              <a
                href="https://chat.whatsapp.com/BKGZTksioSM2uZxT73LekI"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline"
              >
                קישור
              </a>
            </li>
            <li>
              כל מה שקשור לתכנות:{" "}
              <a
                href="https://chat.whatsapp.com/HntJcIVz9hO6OCZGg8aHHS"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline"
              >
                קישור
              </a>
            </li>
            <li>
              פאנז, ממים ושטויות:{" "}
              <a
                href="https://chat.whatsapp.com/BhAULU6EwvX6DzyNKVfwyw"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline"
              >
                קישור
              </a>
            </li>
            <li>
              משחקים יחד בזום / דיבורי גיימרים:{" "}
              <a
                href="https://chat.whatsapp.com/LSG6F1LIRMCLKKYLpEthXX"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline"
              >
                קישור
              </a>
            </li>
            <li>
              קבוצה לסקצייה הכי טובה:{" "}
              <a
                href="https://chat.whatsapp.com/BAGLroOE1zA459m1hvmeTu"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline"
              >
                קישור
              </a>
            </li>
            <li>
              קבוצת צפייה בסרטים:{" "}
              <a
                href="https://chat.whatsapp.com/K8oCZpLv5Bo2InXiLjxhUo"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline"
              >
                קישור
              </a>
            </li>
            <li>
              פוקימון / קלפי פוקימון:{" "}
              <a
                href="https://chat.whatsapp.com/GuqMt7bzIDKK5RCALMKW89"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline"
              >
                קישור
              </a>
            </li>
            <li>
              בגדים וסטאף של בנות:{" "}
              <a
                href="https://chat.whatsapp.com/EafSRGqkzDjAJybrQtenjd"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline"
              >
                קישור
              </a>
            </li>
            <li>
              קבוצת מייפלסט(ק)ורי של הלסקור:{" "}
              <a
                href="https://chat.whatsapp.com/Fi6nBIpACePE3hlwL4I6iL"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline"
              >
                קישור
              </a>
            </li>
            <li>
              קבוצת להקות ופרוייקטים של חברי הלסקור:{" "}
              <a
                href="https://chat.whatsapp.com/GMYLCdFcOxj6YpRUb9HlCW"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline"
              >
                קישור
              </a>
            </li>
            <li>
              קבוצת דמוקרטיה-סקור:{" "}
              <a
                href="https://chat.whatsapp.com/KGGGoRVBZoXGCdmvYZoScM"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline"
              >
                קישור
              </a>
            </li>
            <li>
              קבוצת חומוסקור- מפגשי חומוס:{" "}
              <a
                href="https://chat.whatsapp.com/LiBDsZC2UgnJR4fOX84Vd3"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline"
              >
                קישור
              </a>
            </li>
          </ul>
          <h3 className="mb-3 text-center text-2xl">אמירות כלליות</h3>
          <ul className="list-inside list-disc pl-5 text-sm">
            <li>״הלסקור זה משפחה״ נועה</li>
            <li>״ומשפחה לא בוחרים״ מיכל</li>
            <li> 🙆🏻‍♂️🙆🏼‍♀️- יגאל</li>
          </ul>
        </>
      ) : (
        <p>אנא התחבר/י 🙂</p>
      )}
    </Layout>
  );
};

export default Catalog;
