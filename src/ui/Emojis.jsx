import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React from 'react'
import { useEffect } from 'react'
import { useState } from 'react'

function Emojis({ emojis , addEmoji , setDisplayEmojis }) {
    const [filter , setFilter] = useState("")
    const [placeHolder , setPlaceHolder] = useState('')

    useEffect(() => {
        const items = document.querySelectorAll('.emoji')
        if(filter.includes(' ')){
            filter.replace(new RegExp(' ' , 'g'),'')
        }

        if(filter){
            items.forEach((item) => {
                if(!item.id.includes(filter.replace(new RegExp(' ' , 'g'),'-').toLowerCase())){
                    item.style.display = 'none'
                }else{
                    item.style.display = 'flex'
                }
            })
        }else{
            items.forEach((item) => item.style.display = 'flex')
        }
    },[filter])

  return (
    <div className="emojis">
        <div className="emojis--bar">
        <input type="text" placeholder={placeHolder} onChange={(event) => setFilter(event.target.value)} className="emojis--input" />
        <button onClick={() => setDisplayEmojis(false)} className="emojis__close">
            <FontAwesomeIcon icon='fa fa-xmark' />
        </button>
        </div>
        <ul className="emojis--list">
            {
                emojis && (
                    <>
                    {emojis.map((emoji) => <li className='emoji' onClick={() => addEmoji(emoji.slug)} onMouseEnter={() => setPlaceHolder(emoji.slug)} key={emoji.slug} id={emoji.slug}>{emoji.character}</li>)}
                    <div className="emojis--close"></div>
                    </>
                )
            }
        </ul>
    </div>
  )
}

export default Emojis