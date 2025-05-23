import React, { useEffect, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import { Link, useParams } from 'react-router-dom'
import Avatar from './Avatar'
import { HiOutlineDotsVertical } from "react-icons/hi";
import { FaAngleLeft } from "react-icons/fa6";
import { FaPlus } from "react-icons/fa6";
import { FaImage } from "react-icons/fa6";
import { FaVideo } from "react-icons/fa6";
import { IoClose } from "react-icons/io5";
import { IoMdSend } from "react-icons/io";
import uploadFile from '../helpers/UploadFile';
import Loading from './Loading';
import backgroundImage from "../assets/wallapaper.jpeg"
import moment from "moment"

const MessagePage = () => {

  const params = useParams()
  const socketConnection = useSelector((state) => state?.user?.socketConnection)
  const user = useSelector((state) => state?.user)
  const [dataUser, setUserData] = useState({
    _id: "",
    name: "",
    email: "",
    profile_pic: "",
    online: false
  })

  const [openImageVideoUpload, setOpenImageVideoUpload] = useState(false)

  const [message, setMessage] = useState({
    text : "",
    imageUrl : "",
    videoUrl : ""
  })
  const [loading, setLoading] = useState(false)
  const [allMessage, setAllMessage] = useState([])
  const currentMessage = useRef(null)

  useEffect(()=>{
      if(currentMessage.current){
          currentMessage.current.scrollIntoView({behavior : 'smooth', block : 'end'})
      }
  },[allMessage])

  const handleImageVideoUploadOpen = () => {
    setOpenImageVideoUpload((prev) => !prev)
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files[0]

    setLoading(true)
    const uploadImage = await uploadFile(file)
    setLoading(false)
    setOpenImageVideoUpload(false)

    setMessage((prev) => {
      return {
        ...prev,
        imageUrl: uploadImage?.url
     }
    })
  }

  const handleClearUploadImage = () => {
    setMessage(prev => {
      return{
        ...prev,
        imageUrl : ""
      }
    })
  }

  const handleVideoUpload = async (e) => {
    const file = e.target.files[0]

    setLoading(true)
    const uploadVideo = await uploadFile(file)
    setLoading(false)
    setOpenImageVideoUpload(false)

    setMessage((prev) => {
      return {
        ...prev,
        videoUrl: uploadVideo?.url
     }
    })
  }

  const handleClearUploadVideo = () => {
    setMessage(prev => {
      return{
        ...prev,
        videoUrl : ""
      }
    })
  }

  useEffect(() => {
    if(socketConnection){
      socketConnection.emit("message-page", params?.userId)

      socketConnection.on("message-user", (data) => {
        // console.log("Data: ", data)
        setUserData(data)
      })

      socketConnection.on("message", (data) => {
        console.log("message data:: ", data);
        setAllMessage(data);
      })
    }

  }, [socketConnection, params?.userId, user])

  const handleOnChange = (e) => {
    const {name, value} = e.target

    setMessage(prev => {
      return{
        ...prev,
        text : value
      }
    })
  }

  const handleSendMessage = (e) => {
    e.preventDefault()

    if(message.text || message.imageUrl || message.videoUrl){
      if(socketConnection){
        socketConnection.emit('new message',{
          sender : user?._id,
          receiver : params.userId,
          text : message.text,
          imageUrl : message.imageUrl,
          videoUrl : message.videoUrl,
          msgByUserId : user?._id
        })
        setMessage({
          text : "",
          imageUrl : "",
          videoUrl : ""
        })
      }
    }
  }


  return (
    <div style={{ backgroundImage : `url(${backgroundImage})`}} className='bg-no-repeat bg-cover'>
      <header className='sticky top-0 h-16 bg-white flex justify-between items-center p-4'>
        <div className='flex items-center gap-4'>
            <Link to={"/"} className='lg:hidden'>
              <FaAngleLeft size={25} />
            </Link>
            <div>
              <Avatar
                width={50}
                height={50}
                imageUrl={dataUser?.profile_pic}
                name={dataUser?.name}
                userId={dataUser?._id}
              />
            </div>
            <div>
              <h3 className='font-semibold text-lg text-ellipsis line-clamp-1'>{dataUser?.name}</h3>
              <p className='-my-1 text-sm'>
                {
                  dataUser?.online ? <span className='text-primary'>online</span> : <span className='text-slate-500'>offline</span>
                }
              </p>
            </div>
        </div>

        <div>
          <button className='cursor-pointer hover:text-primary'>
            <HiOutlineDotsVertical size={25} />
          </button>
        </div>
      </header>

      {/* Show all messages */}
      <section className='h-[calc(100vh-128px)] overflow-x-hidden overflow-y-scroll scrollbar relative bg-slate-200 bg-opacity-50'>
            
            {/* all message show here */}
            <div ref={currentMessage} className='flex flex-col gap-2 py-2 mx-2'>
              {
                allMessage?.map((msg, index) => {
                  return (
                    <div className={`p-1 rounded w-fit max-w-[280px] md:max-w-sm lg:max-w-md ${user._id === msg?.msgByUserId ? "ml-auto bg-teal-200" : "bg-white"}`}>
                      <div className='w-full relative'>
                        {
                          msg?.imageUrl && (
                            <img 
                              src={msg?.imageUrl}
                              className='w-full h-full object-scale-down'
                            />
                          )
                        }
                        {
                          msg?.videoUrl && (
                            <video
                              src={msg.videoUrl}
                              className='w-full h-full object-scale-down'
                              controls
                            />
                          )
                        }
                      </div>
                      <p className='px-2'>{msg.text}</p>
                      <p className='text-xs ml-auto w-fit'>{moment(msg.createdAt).format('hh:mm')}</p>
                    </div>
                  )
                })
              }
            </div>



            {/**upload Image display */}
            {
              message.imageUrl && (
                <div className='w-full h-full sticky bottom-0 bg-slate-700 bg-opacity-30 flex justify-center items-center rounded overflow-hidden'>
                  <div onClick={handleClearUploadImage} className='w-fit p-2 absolute top-0 right-0 cursor-pointer hover:text-red-600'>
                      <IoClose size={30}/>
                  </div>
                  <div className='bg-white p-3'>
                      <img
                        src={message.imageUrl}
                        alt='uploadImage'
                        className='aspect-square w-full h-full max-w-sm m-2 object-scale-down'
                      />
                  </div>
                </div>
              )
            }

            {/**upload Video display */}
            {
              message.videoUrl && (
                <div className='w-full h-full sticky bottom-0 bg-slate-700 bg-opacity-30 flex justify-center items-center rounded overflow-hidden'>
                  <div onClick={handleClearUploadVideo} className='w-fit p-2 absolute top-0 right-0 cursor-pointer hover:text-red-600'>
                      <IoClose size={30}/>
                  </div>
                  <div className='bg-white p-3'>
                      <video
                        src={message.videoUrl}
                        className='aspect-square w-full h-full max-w-sm m-2 object-scale-down'
                        controls
                        muted
                        autoPlay
                      />
                  </div>
                </div>
              )
            }

{
            loading && (
                <div className='w-full h-full flex sticky bottom-0 justify-center items-center'>
                  <Loading />
                </div>
              )
            }
      </section>

      {/* Send message section */}
      <section className='h-16 bg-white flex items-center px-4'>
        <div className='relative'>
          <button onClick={handleImageVideoUploadOpen} className='flex justify-center items-center w-11 h-11 rounded-full hover:bg-primary hover:text-white'>
            <FaPlus />
          </button>

          {/* video, image opening block */}
          {
            openImageVideoUpload && (
              <div className='absolute bottom-14 w-36 bg-white shadow rounded p-2'>
                <form>
                  <label htmlFor='uploadImage' className='flex items-center p-2 px-3 gap-3 hover:bg-slate-200 cursor-pointer'>
                      <div className='text-primary'>
                        <FaImage size={18}/>
                      </div>
                      <p>Image</p>
                  </label>
                  <label htmlFor='uploadVideo' className='flex items-center p-2 px-3 gap-3 hover:bg-slate-200 cursor-pointer'>
                      <div className='text-purple-500'>
                        <FaVideo size={18}/>
                      </div>
                      <p>Video</p>
                  </label>

                  <input 
                    type="file"
                    id='uploadImage'
                    onChange={handleImageUpload}
                    className='hidden'
                  />

                  <input 
                    type="file"
                    id='uploadVideo'
                    onChange={handleVideoUpload}
                    className='hidden'
                  />
                  
                </form>
              </div>
            )
          }

        </div>

        {/**input box */}
        <form className='h-full w-full flex gap-2' onSubmit={handleSendMessage}>
          <input
            type='text'
            placeholder='Type here message...'
            className='py-1 px-4 outline-none w-full h-full'
            value={message.text}
            onChange={handleOnChange}
          />

          <button className='text-primary hover:text-secondary'>
            <IoMdSend size={28}/>
          </button>
        </form>

      </section>
    </div>
  )
}

export default MessagePage
