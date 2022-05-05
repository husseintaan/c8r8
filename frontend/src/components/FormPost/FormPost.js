import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import InputLabel from '@mui/material/InputLabel';


import DialogTitle from '@mui/material/DialogTitle';
import TextField from '@mui/material/TextField';
import React, { useState } from "react";
import "./FormPost.css";
// Component that presents a dialog to collect post information from user
export default function FormPost({
 open,
 onSubmit,
 onClose,
 title,
 submitText,
}) { 
    let [usdpost, setUsdpost] = useState("");
    let [lbppost, setLbppost] = useState("");
    let [type, setType] = useState("");
    const handleChange = (e) => {
        setType(e.target.value);
      };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
            <div className="dialog-container">
                <DialogTitle>{title}</DialogTitle>
                <div className="form-item">
                    <TextField
                    fullWidth
                    label="USD Amount"
                    type="number"
                    value={usdpost}
                    onChange={({ target: { value } }) => setUsdpost(value)}
                    />
                </div>
                <div className="form-item">
                    <TextField
                    fullWidth
                    label="LBP Amount"
                    type="number"
                    value={lbppost}
                    onChange={({ target: { value } }) => setLbppost(value)}
                    />
                </div>
                <div className='form-item'>
                    <InputLabel id="demo-simple-select-label">Type</InputLabel>
                        <Select
                            labelId="demo-simple-select-label"
                            id="demo-simple-select"
                            value={type}
                            label="Type"
                            onChange={handleChange}
                        >
                            <MenuItem value={0}>Buy USD</MenuItem>
                            <MenuItem value={1}>Sell USD</MenuItem>
                        </Select>
                </div>
                <Button
                color="primary"
                variant="contained"
                onClick={() => onSubmit(usdpost, lbppost, type)}
                >
                    {submitText}
                </Button>
            </div>
        </Dialog>
    );
}

