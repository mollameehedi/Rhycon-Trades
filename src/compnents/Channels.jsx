import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { useEffect, useRef, useState } from "react";
import Message from "../ui/Message";
import { db, storage } from "../firebase/init";
import {
  addDoc,
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { useInView } from "react-intersection-observer";
import { getDownloadURL, uploadBytes, ref } from "firebase/storage";
import { v4 } from "uuid";
import Operation from "../ui/Operation";
import { Link } from "react-router-dom";
import PageNotFound from "../pages/pageNotFound";

function Channels({
  user,
  channel,
  setDisplaySideBar,
  displaySideBar,
  usersList,
  displayUsersList,
  setDisplayUsersList,
  claimRole,
  badWords,
  rhyconBot,
  roles,
  commands,
  tickets,
  isDark,
  channels,
  doesExist
}) {
  const [messages, setMessages] = useState(null);
  const [text, setText] = useState("");
  const [displayAtMenu, setDisplayAtMenu] = useState(false);
  const [displayChannelMenu, setDisplayChannelMenu] = useState(false);
  const [displayCommandsMenu, setDisplayCommandsMenu] = useState(false);
  const [displayOperation, setDisplayOperation] = useState(false);
  const [operationState, setOperationState] = useState(false);
  const [operationMessage, setOperationMessage] = useState("");
  const [emojis, setEmojis] = useState(false);
  const [polls, setPolls] = useState([]);
  const [newMessage, setNewMessage] = useState();
  const [scrollToBottom, setScrollToBottom] = useState(true);
  const [messageSent, setMessageSent] = useState(true);
  const [replyMessage, setReplyMessage] = useState(null);
  const [scrollDown, setScrollDown] = useState(true);
  const input = document.getElementById("channel__input");

  const dummy = useRef();
  const { ref: refItem, inView } = useInView();
  let previousMessage = false;
  useEffect(() => {
    const rowData = fetch(
      "https:emoji-api.com/emojis?access_key=39f8ebdd5893bad2f5b3d9bf4434b2716ebb98ab"
    )
      .then((response) => response.json())
      .then((data) =>
        data.filter(
          (item) =>
            !item.slug.includes(
              "rainbow-flag" ||
                "kiss-man-man" ||
                "kiss-woman-woman" ||
                "couple-with-heart-man-man" ||
                "couple-with-heart-woman-woman"
            ) || !containsNumber(item.slug)
        )
      )
      .then((data) => setEmojis(data));
  }, []);

  useEffect(() => {
    getPolls();
  }, []);

  useEffect(() => {
    if (messages && scrollToBottom && doesExist) {
      dummy.current.scrollIntoView();
      setScrollToBottom(false);
    }

    if (eval("user." + channel)) {
      if(doesExist){
        const post = {
          [channel]: deleteField(),
        };
        updateDoc(doc(db, "users", user.docId), post);
      }
    }
  }, [messages]);

  useEffect(() => {
    if (newMessage && doesExist && (newMessage.userId === user.uid || inView)) {
      dummy.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [newMessage]);

  useEffect(() => {
    if(doesExist){
    dummy.current.scrollIntoView();
    }
  }, [scrollDown]);

  useEffect(() => {
    if (db) {
      importData();
    }
  }, [db]);

  useEffect(() => {
    setMessages(null);
    importData();
  }, [channel]);

  useEffect(() => {
    text[text.length - 1] !== "@" && setDisplayAtMenu(false);
    text[text.length - 1] === "@" && setDisplayAtMenu(true);
    text[text.length - 1] !== "#" && setDisplayChannelMenu(false);
    text[text.length - 1] === "#" && setDisplayChannelMenu(true);
    text[text.length - 1] !== "/" && setDisplayCommandsMenu(false);
    text[text.length - 1] === "/" &&
      (user.founder || user.admin) &&
      setDisplayCommandsMenu(true);
  }, [text]);

  function importData() {
    const q = query(
      collection(db, "messages"),
      where("channel", "==", channel),
      orderBy("createdAt"),
      limit(100)
    );
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const data = [];
      querySnapshot.forEach((doc) => {
        const newData = { ...doc.data(), id: doc.id };
        data.push(newData);
        setNewMessage(newData);
      });
      setMessages(data);
    });
  }

  async function sendMessage(event) {
    event.preventDefault();
    const message = event.target[0].value;
    let mention = [];
    let isReturn;

    commands.map((el) => {
      if (message.toLowerCase().includes("/" + el)) {
        command(message, el);
        isReturn = true;
      }
    });

    if (isReturn) {
      return;
    }

    await badWords.map((badWord) => {
      if (message.toLowerCase().includes(badWord)) {
        const warning = user.warn + 1;
        let mentions;
        if (eval("user." + channel)) {
          mentions = eval("user." + channel) + 1;
        } else {
          mentions = 1;
        }

        const post = {
          warn: warning,
          [channel]: mentions,
        };
        const messageText = `@${
          user.displayName
        } have been warned for using disrespectful words , you now have ${
          user.warn + 1
        } ${user.warn + 1 > 1 ? "warnings" : "warning"}`;
        const message = {
          text: messageText,
          userName: rhyconBot.displayName,
          photoUrl: rhyconBot.photoUrl,
          userId: rhyconBot.uid,
          createdAt: serverTimestamp(),
          channel: channel,
          replyTo: null,
          img: false,
        };
        setText("");
        const userRef = doc(db, "users", user.docId);
        updateDoc(userRef, post);
        addDoc(collection(db, "messages"), message);

        isReturn = true;
        return;
      }
    });

    if (isReturn) {
      return;
    }

    usersList.map((item) => {
      if (text.includes("@" + item.displayName)) {
        mention.push({ id: item.docId, channel: channel });
      }
    });

    roles.map((role) => {
      if (text.includes("@" + role)) {
        let mentionUsers;
        if (role !== "everyone") {
          mentionUsers = usersList.filter(
            (item) => eval("item." + role) === true
          );
        } else if (role === "everyone") {
          mentionUsers = usersList;
        }
        mentionUsers.map((item) => {
          mention.push({ id: item.docId, channel: channel });
        });
      }
    });

    if (message != false) {
      let post;
      let replyTo;

      if (replyMessage) {
        replyTo = replyMessage.id;
        setReplyMessage(null);
      } else {
        replyTo = null;
      }
      post = {
        text: message,
        userName: user.displayName,
        photoUrl: user.photoUrl,
        userId: user.uid,
        createdAt: serverTimestamp(),
        channel: channel,
        replyTo: replyTo,
        img: false,
      };
      await addDoc(collection(db, "messages"), post);
      setMessageSent(!messageSent);
      setText("");
      input.value = "";
      mention.map((item) => {
        let mentionPost;
        if (eval("item." + channel) > 0) {
          let num = eval("item." + channel) + 1;
          mentionPost = {
            [channel]: num,
          };
        } else {
          mentionPost = {
            [channel]: 1,
          };
        }

        updateDoc(doc(db, "users", item.id), mentionPost);
      });
    }
  }

  function moveToView() {
    setScrollDown(!scrollDown);
  }

  async function sendImage(event) {
    event.preventDefault();
    const image = event.target.files[0];
    if (image === null) {
      return;
    }

    if (image.size > 8388608) {
      setDisplayOperation(true);
      setOperationMessage("File transfer limit is 8MB");
      setOperationState(false);
      return;
    }

    let replyTo;

    if (replyMessage) {
      replyTo = replyMessage.id;
      setReplyMessage(null);
    } else {
      replyTo = null;
    }

    const imageRef = ref(storage, `images/${v4()}`);
    const uploadTask = uploadBytes(imageRef, image).then(() => {
      const link = getDownloadURL(imageRef).then((url) => {
        const post = {
          imageUrl: url,
          userName: user.displayName,
          photoUrl: user.photoUrl,
          userId: user.uid,
          createdAt: serverTimestamp(),
          channel: channel,
          replyTo: replyTo,
          img: true,
        };

        addDoc(collection(db, "messages"), post);
      });
    });
  }

  async function command(command, type) {
    setText("");
    if (user.founder || user.admin || text.split(" ")[0] === "/status") {
      let message;
      let isReturn;
      if (
        type === "warn" ||
        type === "ban" ||
        type === "kick" ||
        type === "mute"
      ) {
        const effectedUser = command.split(" ")[1];
        const rawDuration = command.split(" ")[2];
        const duration = new Date();
        if (type === "ban" || type === "mute") {
          duration.setDate(duration.getDate() + +rawDuration);
        }

        const target = usersList.find(
          (el) =>
            el.displayName.replace(new RegExp(" ", "g"), "") === effectedUser
        );
        if (target == undefined) {
          console.log(undefined);
          isReturn = true;
          return;
        }
        message = {
          text: `@${target.displayName} has benn ${
            type !== "ban" ? type : "bann"
          }ed for ${rawDuration} day(s) for violating our community guidelines , he now has ${
            type !== "mute" ? eval("target." + type) + 1 : target.muteCount + 1
          } ${type}(s)`,
          userName: rhyconBot.displayName,
          userId: rhyconBot.uid,
          photoUrl: rhyconBot.photoUrl,
          createdAt: serverTimestamp(),
          channel: channel,
          replyTo: null,
          img: false,
        };
        let action;
        if (type === "ban" || type === "mute") {
          action = {
            [type]: eval("target." + type) + 1,
            [type + "Duration"]: duration,
            [channel]:
              eval("user." + channel) !== undefined
                ? eval("user." + channel) + 1
                : 1,
          };
        } else {
          action = {
            [type]: eval("target." + type) + 1,
            [channel]:
              eval("user." + channel) !== undefined
                ? eval("user." + channel) + 1
                : 1,
          };
        }

        updateDoc(doc(db, "users", target.docId), action);
      } else if (type === "status") {
        message = {
          text: `@${user.displayName}, since you joined you have had ${user.ban} ban(s), ${user.kick} kick(s), ${user.mute} mute(s), ${user.warn} warn(s)`,
          userName: rhyconBot.displayName,
          userId: rhyconBot.uid,
          photoUrl: rhyconBot.photoUrl,
          createdAt: serverTimestamp(),
          channel: channel,
          replyTo: null,
          img: false,
        };

        updateDoc(doc(db, "users", user.docId), {
          [channel]:
            eval("user." + channel) !== undefined
              ? eval("user." + channel) + 1
              : 1,
        });
      } else if (type === "give" || type === "remove") {
        const targetName = command.split(" ")[1];
        const targetRole = command.split(" ")[2].toLowerCase();
        const target = usersList.find(
          (el) =>
            el.displayName.replace(new RegExp(" ", "g"), "") === targetName
        );

        if (target == undefined) {
          isReturn = true;
          return;
        }

        roles.map((el) => {
          if (el.toLowerCase() !== targetRole) {
            isReturn = true;
            return;
          }
        });

        let messageText;
        let action;

        if (type === "give") {
          messageText = `@${target.displayName} now have "${targetRole}"`;
          action = {
            [channel]:
              eval("user." + channel) !== undefined
                ? eval("user." + channel) + 1
                : 1,
            [targetRole]: true,
          };
        } else {
          messageText = `"${targetRole}" have been removed from @${target.displayName} `;
          action = {
            [channel]:
              eval("user." + channel) !== undefined
                ? eval("user." + channel) + 1
                : 1,
            [targetRole]: false,
          };
        }

        message = {
          text: messageText,
          userName: rhyconBot.displayName,
          userId: rhyconBot.uid,
          photoUrl: rhyconBot.photoUrl,
          createdAt: serverTimestamp(),
          channel: channel,
          replyTo: null,
          img: false,
        };

        updateDoc(doc(db, "users", target.docId), action);
        addDoc(collection(db, "messages"), message);
      } else if (type === "send") {
        const messageText = command.replace("/send", "");
        message = {
          text: messageText,
          userName: rhyconBot.displayName,
          userId: rhyconBot.uid,
          photoUrl: rhyconBot.photoUrl,
          createdAt: serverTimestamp(),
          channel: channel,
          replyTo: null,
          img: false,
        };
      } else if (type === "close") {
        if (channel.includes("ticket")) {
          const target = tickets.find((ticket) => ticket.name === channel);
          message = {
            text: `closing ticket`,
            userName: rhyconBot.displayName,
            userId: rhyconBot.uid,
            photoUrl: rhyconBot.photoUrl,
            createdAt: serverTimestamp(),
            channel: channel,
            replyTo: null,
            img: false,
          };
          updateDoc(doc(db, "tickets", target.docId), { display: false });
        } else {
          message = {
            text: `@${user.displayName}, you can't use this command here`,
            userName: rhyconBot.displayName,
            userId: rhyconBot.uid,
            photoUrl: rhyconBot.photoUrl,
            createdAt: serverTimestamp(),
            channel: channel,
            replyTo: null,
            img: false,
          };
        }
      } else if (type === "clear") {
        messages.map((item) => {
          if (item.channel === channel) {
            const docRef = doc(db, "messages", item.id);
            deleteDoc(docRef);
          }
        });
      } else if (type === "poll") {
        const rawCommand = command.split(' "');
        const header = rawCommand[1].replace('"', "");
        const text = rawCommand[2].replace('"', "");
        rawCommand.shift();
        rawCommand.shift();
        rawCommand.shift();
        let count = 1;
        let post = { text: text, header: header };
        rawCommand.map((el) => {
          post = {
            ...post,
            ["option" + count.toString()]: el.replace('"', ""),
            ["option" + count.toString() + "Count"]: 0,
          };
          count++;
        });

        addDoc(collection(db, "polls"), post);
      } else if (type === "delete-poll") {
        const targetHeader = command.replace("/delete-poll ", "");
        const target = polls.find((poll) => poll.header === targetHeader);
        await deleteDoc(doc(db, "polls", target.docId));
      } else if (type === "marketing-cv") {
        const targetName = command.replace("/marketing-cv ", "");
        const target = usersList.find(
          (el) => el.displayName.replace(" ", "") === targetName
        );
        if (user) {
          if (target.marketing) {
            message = {
              text: `@${target.displayName} 's marketing cv is : ${target.marketingCv}`,
              userName: rhyconBot.displayName,
              userId: rhyconBot.uid,
              photoUrl: rhyconBot.photoUrl,
              createdAt: serverTimestamp(),
              channel: channel,
              replyTo: null,
              img: false,
            };
          } else {
            message = {
              text: `@${target.displayName} is not a member of the marketing team`,
              userName: rhyconBot.displayName,
              userId: rhyconBot.uid,
              photoUrl: rhyconBot.photoUrl,
              createdAt: serverTimestamp(),
              channel: channel,
              replyTo: null,
              img: false,
            };
          }
        } else {
          message = {
            text: `@${target.displayName} doesn't exist`,
            userName: rhyconBot.displayName,
            userId: rhyconBot.uid,
            photoUrl: rhyconBot.photoUrl,
            createdAt: serverTimestamp(),
            channel: channel,
            replyTo: null,
            img: false,
          };
        }
      }

      if (isReturn) {
        return;
      }
      if (message) {
        addDoc(collection(db, "messages"), message);
      }
    }
  }

  async function openTicket() {
    if (user) {
      let name = "ticket" + tickets.length.toString();
      if (tickets.length < 10) {
        name = "ticket0" + tickets.length.toString();
      }

      const ticket = {
        name: name,
        new: true,
        user1: user.displayName,
        uid1: user.uid,
        ticketNum: tickets.length,
        display: true,
      };

      const message = {
        text: `@${user.displayName}, thanks for reaching out @founder or @admin will reach you out soon}`,
        userName: rhyconBot.displayName,
        userId: rhyconBot.uid,
        photoUrl: rhyconBot.photoUrl,
        createdAt: serverTimestamp(),
        channel: name,
        replyTo: null,
        img: false,
      };

      await addDoc(collection(db, "tickets"), ticket);
      addDoc(collection(db, "messages"), message);
    }
  }

  async function getPolls() {
    const unsubscribe = onSnapshot(collection(db, "polls"), (snapshot) => {
      const pollsList = [];
      snapshot.forEach((el) => {
        pollsList.push({ ...el.data(), docId: el.id });
      });
      if (pollsList !== polls) {
        setPolls(pollsList);
      }
    });
  }

  async function replyTo(message) {
    setReplyMessage(message);
  }

  function containsNumber(str) {
    return /[0-9]/.test(str);
  }

  async function choosePoll(el) {
    let post = {};
    if (eval("el." + user.uid) === undefined) {
      post = {
        [user.uid]: el.storedIn,
        [el.storedIn + "Count"]: eval("el." + el.storedIn + "Count") + 1,
      };
    } else {
      const rowUserEl = eval("el." + user.uid);
      const userEl = eval("el." + rowUserEl + "Count");
      post = {
        [rowUserEl + "Count"]: userEl - 1,
        [user.uid]: el.storedIn,
        [el.storedIn + "Count"]: eval("el." + el.storedIn + "Count") + 1,
      };
    }
    await updateDoc(doc(db, "polls", el.docId), post);
  }

  async function deselectPoll(el) {
    const rowUserEl = eval("el." + user.uid);
    const userEl = eval("el." + rowUserEl + "Count");

    const post = {
      [rowUserEl + "Count"]: userEl - 1,
      [user.uid]: deleteField(),
    };

    await updateDoc(doc(db, "polls", el.docId), post);
  }  

  return (
        <div id="channel" className="channel">
          <div className="channel--bar">
            <button
              onClick={() => setDisplaySideBar(!displaySideBar)}
              className={`bar__btn ${!displaySideBar && "bar__btn-selected"}`}
            >
              <FontAwesomeIcon icon="fa fa-bars" />
              {user.intro ||
                user.faq ||
                user.announcements ||
                user.results ||
                user.general ||
                user.begginer ||
                user.ask ||
                user.cliam ||
                user.polls ||
                (user.invites && <span className="bar__btn--dot"></span>)}
            </button>
            <p className="bar__header">#{channel}</p>
            <button
              onClick={() => setDisplayUsersList(!displayUsersList)}
              className={`bar__btn ${!displayUsersList && "bar__btn-selected"}`}
            >
              <FontAwesomeIcon icon="fa fa-user" />
            </button>
          </div>
          <div className="channel--messages">
            <div className="channel--intro">
              <h2 className="channel__header">Welcome to {channel}</h2>
              <p className="channel__para">this is the start of this channel</p>
            </div>
            <ul className="channel--messages-wrapper">
              {channel === "claim" && (
                <div className="message--content">
                  <h5>Claim Roles:</h5>
                  <ul className="claim-roles">
                    <li className="calim-roles--role">
                      <p>Crypto</p>{" "}
                      {!user.crypto ? (
                        <button
                          onClick={() => claimRole("crypto", true)}
                          className="claim-roles__btn claim-roles__btn--claim"
                        >
                          claim
                        </button>
                      ) : (
                        <button
                          onClick={() => claimRole("crypto", false)}
                          className="claim-roles__btn claim-roles__btn--remove"
                        >
                          remove
                        </button>
                      )}
                    </li>
                    <li className="calim-roles--role">
                      <p>Stocks</p>{" "}
                      {!user.stocks ? (
                        <button
                          onClick={() => claimRole("stocks", true)}
                          className="claim-roles__btn claim-roles__btn--claim"
                        >
                          claim
                        </button>
                      ) : (
                        <button
                          onClick={() => claimRole("stocks", false)}
                          className="claim-roles__btn claim-roles__btn--remove"
                        >
                          remove
                        </button>
                      )}
                    </li>
                    <li className="calim-roles--role">
                      <p>Forex</p>{" "}
                      {!user.forex ? (
                        <button
                          onClick={() => claimRole("forex", true)}
                          className="claim-roles__btn claim-roles__btn--claim"
                        >
                          claim
                        </button>
                      ) : (
                        <button
                          onClick={() => claimRole("forex", false)}
                          className="claim-roles__btn claim-roles__btn--remove"
                        >
                          remove
                        </button>
                      )}
                    </li>
                    <li className="calim-roles--role">
                      <p>Free Signals</p>{" "}
                      {!user.free_signals ? (
                        <button
                          onClick={() => claimRole("free_signals", true)}
                          className="claim-roles__btn claim-roles__btn--claim"
                        >
                          claim
                        </button>
                      ) : (
                        <button
                          onClick={() => claimRole("free_signals", false)}
                          className="claim-roles__btn claim-roles__btn--remove"
                        >
                          remove
                        </button>
                      )}
                    </li>
                  </ul>
                </div>
              )}

              {channel === "polls" && (
                <div>
                  {polls.map((data) => {
                    const options = [];
                    {
                      for (
                        let i = 1;
                        eval("data.option" + i.toString()) !== undefined;
                        i++
                      ) {
                        options.push({
                          ...data,
                          option: eval("data.option" + i.toString()),
                          storedIn: "option" + i.toString(),
                        });
                      }
                    }
                    return (
                      <div
                        key={data.docId}
                        style={{ marginBottom: "60px" }}
                        className="message--content"
                      >
                        <h5 style={{ marginBottom: "10px" }}>{data.header}</h5>
                        <p>{data.text}</p>
                        <ul className="claim-roles">
                          {options.map((el, _) => {
                            return (
                              <li key={_} className="calim-roles--role">
                                <p>{el.option}</p>
                                {eval("el." + user.uid) !== el.storedIn ? (
                                  <button
                                    onClick={() => choosePoll(el)}
                                    className="claim-roles__btn claim-roles__btn--claim"
                                  >
                                    Select
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => deselectPoll(el)}
                                    className="claim-roles__btn claim-roles__btn--remove"
                                  >
                                    Deselect
                                  </button>
                                )}

                                <p style={{ marginLeft: "20px" }}>
                                  count: {eval("el." + el.storedIn + "Count")}
                                </p>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    );
                  })}
                </div>
              )}

              {channel === "ask" && (
                <div className="message--content">
                  <h5>Need Help ?!</h5>
                  <p style={{ margin: "14px 0" }}>
                    {" "}
                    At Rhycon we are happy to help all traders new and even the experienced.<br/>
                    Open a ticket below to talk with a member of our staff.
                  </p>
                  <button onClick={openTicket}>open a ticket</button>
                </div>
              )}

              {messages &&
                messages.map((message) => {
                  const data = (
                    <Message
                      scroll={moveToView}
                      user={user}
                      userId={message.userId}
                      usersList={usersList}
                      message={message}
                      replyTo={replyTo}
                      emojis={emojis}
                      previousMessage={previousMessage}
                      displaySideBar={displaySideBar}
                      key={message.id}
                      channels={channels}
                      isDark={isDark}
                    />
                  );
                  previousMessage = message;
                  return data;
                })}
              <div ref={dummy}>
                <div ref={refItem}></div>
              </div>
            </ul>
          </div>
          {(channel !== "claim" &&
            channel !== "ask" &&
            channel !== "intro" &&
            channel !== "polls" &&
            channel !== "announcements" &&
            channel !== "faq") ||
          user.founder ||
          user.admin ? (
            <div className="channel__form-wrapper">
              <label for="actual-btn" className="form--img">
                <FontAwesomeIcon icon={"fa fa-plus"} />
              </label>
              <input
                onChange={(event) => sendImage(event)}
                id="actual-btn"
                type="file"
                accept="image/*"
                hidden
              />
              <form
                style={{ maxWidth: "100%", width: "100%" }}
                onSubmit={(event) => sendMessage(event)}
                className="channel__form"
              >
                <input
                  autoComplete="off"
                  placeholder="Message"
                  type="text"
                  id="channel__input"
                  className="channel__input"
                  onChange={(event) => setText(event.target.value)}
                  value={text}
                />
                <button type="submit" className="channel__submit">
                  <FontAwesomeIcon icon="fa fa-paper-plane" />
                </button>
                {replyMessage !== null && (
                  <div className="channel--reply">
                    <p className="channel--reply__text">
                      Replying to {replyMessage.userName}
                    </p>
                    <button
                      onClick={() => {
                        setReplyMessage(null);
                      }}
                      className="channel--reply__cancel"
                    >
                      <FontAwesomeIcon icon="fa fa-xmark" />
                    </button>
                  </div>
                )}
                {displayAtMenu && (
                  <div className="channel--reply channel--menu">
                    <ul className="channel--menu__users">
                      {roles.map((role) => (
                        <li
                          onClick={() => setText(text + role)}
                          key={role}
                          className="menu__user"
                        >
                          <p className="menu__user--name">{"@" + role}</p>
                        </li>
                      ))}
                      {usersList &&
                        usersList.map((item) => (
                          <li
                            onClick={() => setText(text + item.displayName)}
                            key={item.uid}
                            className="menu__user"
                          >
                            <figure className="menu__user--img">
                              <img src={item.photoUrl} />
                            </figure>
                            <p className="menu__user--name">
                              {item.displayName}
                            </p>
                          </li>
                        ))}
                    </ul>
                  </div>
                )}

                {displayCommandsMenu && (
                  <div className="channel--reply channel--menu">
                    <ul className="channel--menu__users">
                      {commands.map((item, _) => {
                        return (
                          <li
                            key={_}
                            onClick={() => setText(text + item)}
                            className="menu__user"
                          >
                            <p className="menu__user--name">/ {item}</p>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}

                {displayChannelMenu && (
                  <div className="channel--reply channel--menu">
                    <ul className="channel--menu__users">
                      {channels.map((item, _) => {
                        return (
                          <li
                            key={_}
                            onClick={() => setText(text + item)}
                            className="menu__user"
                          >
                            <p className="menu__user--name"># {item}</p>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </form>
            </div>
          ) : (
            <div className="channel__form-wrapper">
              <div className="channel__input" style={{ cursor: "not-allowed" }}>
                You don't have permission
              </div>
            </div>
          )}

          {displayOperation && (
            <Operation
              setOperation={setDisplayOperation}
              success={operationState}
              message={operationMessage}
            />
          )}
          {channel.includes("marketing") && (
            <Link to="/marketing">
              <button className="marketing--redirect">
                <FontAwesomeIcon icon="fa fa-bullhorn" />
              </button>
            </Link>
          )}
        </div>
  );
}

export default Channels;
