import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { useState } from "react";
import { db } from "../firebase/init";
import {
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore";
import { useEffect } from "react";
import Emojis from "./Emojis";
import { Link } from "react-router-dom";

function Message({
  emojis,
  displaySideBar,
  message,
  user,
  replyTo,
  previousMessage,
  usersList,
  userId,
  channels,
  scroll,
  isDark
}) {
  const [edit, setEdit] = useState(false);
  const [copied, setCopied] = useState(false);
  const [reply, setReply] = useState(false);
  const [msgText, setMsgText] = useState(message.text);
  const [displayEmojis, setDisplayEmojis] = useState(false);
  const [slugs, setSlugs] = useState(false);
  const [dateOfCreation, setDateOfCreation] = useState(".");
  const [userInfo, setUserInfo] = useState(null);
  const [color, setColor] = useState("#ffffff");
  const linkRegex = /(https?\:\/\/)?(www\.)?[^\s]+\.[^\s]+/g
  let returnTimes = 0;

  useEffect(() => {
    if (Object.keys(usersList).length > 0) {
      setUserInfo(usersList.find((item) => item.uid === userId));
    }
  }, [usersList]);

  useEffect(() => {
    if (userInfo) {
      if (userInfo.userPriority === 1) {
        if(isDark){
          setColor('#ffffff')
        }else{
          setColor("#000000")
        }
      } else if (userInfo.userPriority === 2) {
        setColor("rgb(194, 124, 14)");
      } else if (userInfo.userPriority === 3) {
        setColor("rgb(0, 122, 255)");
      } else if (userInfo.userPriority === 4) {
        setColor("rgb(255, 0, 0)");
      } else if (userInfo.userPriority === 5) {
        setColor("rgb(244, 127, 255)");
      } else if (userInfo.userPriority === 6) {
        setColor("rgb(8, 188, 231)");
      } else if (userInfo.userPriority === 7) {
        setColor("rgb(26, 227, 29)");
      }
    }
  }, [userInfo] , [isDark]);

  if (edit) {
    document.addEventListener("keydown", (key) => {
      if (key.key === "Escape") {
        setEdit(false);
      }
    });
  }

  /* 
    Date of creation
    */

  useEffect(() => {
    if (message.createdAt !== null) {
      const today = new Date();
      const todayDay = today.getDate();
      const todayMonth = today.getMonth() + 1;
      const todayYear = today.getFullYear();
      const todayDMY = todayDay + "/" + todayMonth + "/" + todayYear;
      const yestardayDMY = todayDay - 1 + "/" + todayMonth + "/" + todayYear;
      const timeFrame = message.createdAt.seconds * 1000;
      const messageDate = new Date(timeFrame);
      const messageDay = messageDate.getDate();
      const messageMonth = messageDate.getMonth() + 1;
      const messageYear = messageDate.getFullYear();
      let myDate = messageDay + "/" + messageMonth + "/" + messageYear;
      let myTime;

      if (messageDate.getMinutes() < 10) {
        myTime = messageDate.getHours() + ":" + "0" + messageDate.getMinutes();
      } else {
        myTime = messageDate.getHours() + ":" + messageDate.getMinutes();
      }

      if (todayDMY === myDate) {
        setDateOfCreation("today at " + myTime);
      } else if (yestardayDMY === myDate) {
        setDateOfCreation("yestarday at " + myTime);
      } else {
        setDateOfCreation(myDate + " at " + myTime);
      }
    }
  }, [message]);

  useEffect(() => {
    if (message.replyTo) {
      getReply();
    }

    if (message.character !== undefined && emojis) {
      const target = emojis.find(
        (emoji) =>
          emoji.slug.replace(new RegExp("-", "g"), "") === message.character
      );
      setSlugs(target);
    }

    if (message.character === undefined) {
      setSlugs(false);
    }
  }, [message]);

  useEffect(() => {
    if (displaySideBar && window.innerWidth <= 768) {
      setDisplayEmojis(false);
    }
  });

  async function getReply() {
    const docRef = doc(db, "messages", message.replyTo);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      setReply(docSnap.data());
    }
  }

  useEffect(() => {
    if (copied) {
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    }
  }, [copied]);

  async function deleteMessage() {
    const docRef = doc(db, "messages", message.id);
    await deleteDoc(docRef);
  }

  async function updateText(event) {
    event.preventDefault();
    const text = event.target[0].value;
    const docRef = doc(db, "messages", message.id);
    const newPost = {
      text: text,
      edited: true,
    };
    setEdit(false);
    await updateDoc(docRef, newPost);
  }

  function copyText() {
    navigator.clipboard.writeText(message.text).then(() => {
      setCopied(true);
    });
  }

  async function addEmoji(slug) {
    setDisplayEmojis(false);

    if (eval("message." + user.uid) === undefined) {
      const docRef = doc(db, "messages", message.id);
      const emoji = slug.replace(new RegExp("-", "g"), "");
      let count;
      let filteredSlug = slug.replace(new RegExp("-", "g"), "");

      if (eval("message." + emoji)) {
        count = eval("message." + emoji) + 1;
      } else {
        count = 1;
      }

      let newPost;

      if (message.character === undefined) {
        newPost = {
          [emoji]: count,
          character: filteredSlug,
          [user.uid]: true,
        };
      } else {
        newPost = {
          [message.character]: count,
          [user.uid]: true,
        };
      }

      filteredSlug === message.character ||
        (message.character === undefined && (await updateDoc(docRef, newPost)));
    }
  }

  async function recactionButton() {
    const docRef = doc(db, "messages", message.id);
    const slug = slugs.slug.replace(new RegExp("-", "g"), "");
    let count;
    let newPost;

    if (eval("message." + user.uid) === true) {
      count = eval("message." + slug) - 1;

      if (count === 0) {
        newPost = {
          [user.uid]: deleteField(),
          character: deleteField(),
          [slug]: deleteField(),
        };
      } else {
        newPost = {
          [user.uid]: deleteField(),
          [slug]: count,
        };
      }
    } else {
      count = eval("message." + slug) + 1;

      newPost = {
        [user.uid]: true,
        [slug]: count,
      };
    }

    await updateDoc(docRef, newPost);
  }

  function replacer(mathched){
    let withProtocol = mathched
    if(!withProtocol.includes('http')){
      withProtocol = 'http://' + mathched
    }

    const newStr = `<a class="message--link" href="${withProtocol}">${mathched}</a>`
    return newStr
  }

  return (
    <>
      <li
        className={`message ${
          message.userId === previousMessage.userId && "message-section"
        } ${message.userId === user.uid && "message-local"}`}
      >
        {previousMessage.userId !== message.userId && (
          <figure className="message--user">
            <img src={message.photoUrl} className="message--user__logo" />
          </figure>
        )}
        <div className="message-container">
          {previousMessage.userId !== message.userId && (
            <p style={message.userId !== 'rhycon-bot' ? { color: color } : isDark? { color: '#ffffff' } : { color: '#000000'} } className="message--user__name">
              {message.userName} &nbsp;{" "}
              <span className="creationDate">{dateOfCreation}</span>
            </p>
          )}
          {edit ? (
            <form onSubmit={(event) => updateText(event)}>
              <input
                type="text"
                className="message--content message--edit"
                onChange={(event) => setMsgText(event.target.value)}
                value={msgText}
              />
              <div className="edit--bar">
                Click enter to{" "}
                <button type="submit" className="purple edit--bar__btn">
                  submit
                </button>{" "}
                or click esc to{" "}
                <button className=" edit--bar__btn purple">escape</button>
              </div>
            </form>
          ) : (
            <>
              {reply !== false && (
                <div className="message--reply">
                  <div className="message--reply-container">
                    <p className="message--reply__name">{reply.userName}</p>
                    <p className="message--reply__text">{reply.text}</p>
                  </div>
                </div>
              )}
{             !message.img ? <p id='message'
                className={`message--content ${
                  reply && "message--content-reply"
                } ${message.userId === 'rhycon-bot' && 'bot-message'}`}
              >
               { (channels.map((channel , _) => {
                  if (returnTimes === 0 && message.text.includes('#'+channel)) {
                    returnTimes++;
                    const rowMessage = message.text.replace(/\s\#(.*?)(\s|$)/g, ' <a class="message--link" href="/app/$1">#$1</a>$2').replace(linkRegex , replacer)
                    return <span key={_} dangerouslySetInnerHTML={{__html: ([rowMessage])}} />
                  }
                }))}
                {
                  returnTimes === 0 && <span dangerouslySetInnerHTML={{__html: ([message.text.replace(linkRegex , replacer)])}} />
                }{" "}
                {message.edited && (
                  <span className="creationDate">(edited)</span>
                )}
                {slugs && emojis && (
                  <div className="reactions-wrapper">
                    <div
                      onClick={recactionButton}
                      className={`reaction ${
                        eval("message." + user.uid) === true && "local-reaction"
                      }`}
                    >
                      {slugs && slugs.character}{" "}
                      {eval(
                        "message." +
                          slugs.slug.replace(new RegExp("-", "g"), "")
                      )}
                    </div>
                  </div>
                )}
              </p>
              :
              <img src={message.imageUrl} alt="" onLoad={scroll} className="message--image" />
              }
            </>
          )}
          <div className="message--bar">
            <button
              onClick={() => setDisplayEmojis(!displayEmojis)}
              className="message--bar__btn"
            >
              <FontAwesomeIcon icon="fa fa-face-smile" />
            </button>
            <button
              onClick={() => replyTo(message)}
              className="message--bar__btn"
            >
              <FontAwesomeIcon icon="fa fa-reply" />
            </button>
            <button onClick={copyText} className="message--bar__btn">
              <FontAwesomeIcon icon="fa fa-copy" />
            </button>
            {(message.userId === user.uid || user.founder || user.admin) && (
              <>
                {message.userId === user.uid && !message.img && (
                  <button
                    onClick={() => setEdit(true)}
                    className="message--bar__btn"
                  >
                    <FontAwesomeIcon icon="fa fa-pen" />
                  </button>
                )}
                <button onClick={deleteMessage} className="message--bar__btn">
                  <FontAwesomeIcon icon="fa fa-trash" />
                </button>
              </>
            )}
          </div>
          {displayEmojis && (
            <Emojis
              setDisplayEmojis={setDisplayEmojis}
              emojis={emojis}
              addEmoji={addEmoji}
            />
          )}
        </div>
      </li>
      {copied && (
        <div className="message--success">
          <FontAwesomeIcon icon="fa fa-check" />
        </div>
      )}
    </>
  );
}

export default Message;
