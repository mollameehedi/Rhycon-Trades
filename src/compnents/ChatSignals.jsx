import React from 'react'
import { Link } from 'react-router-dom'

function ChatSignals(isChat) {
  return (
    <main style={!isChat ? {backgroundColor:'#f7f7f7'} : {backgroundColor:'#ffffff'}} className='features-container'>
        {isChat &&
        <>
            <div>
            <h2 className="section-title feature-title">
                Join Our <b className="purple">Chat room</b>
            </h2>
            <ul className="feature--list signalsChat--list">
                <li className="feature--list__item">
                    <p><b className="purple">Free</b> trading education</p>
                </li>
                <li className="feature--list__item">
                    <p>Learn from <b className='purple'>pro traders</b></p>
                </li>
                <li className="feature--list__item">
                    <p>Interact with the <b className="purple">community</b></p>
                </li>
                <li className="feature--list__item">
                    <p><b className="purple">Experience</b> Rhycon</p>
                </li>
            </ul>
            <Link to='/signin'>
                <button className='features__btn'>Sign Up</button>
            </Link>
            </div>
            <figure className='feature--img chatsignals--img' style={{maxWidth:"650px"}}>
                <img src="https://cdn.discordapp.com/attachments/1075874020299395134/1131216160701026324/Rhycon_Trades_4.png" alt="" />
            </figure>
        </>}
    </main>
  )
}

export default ChatSignals
